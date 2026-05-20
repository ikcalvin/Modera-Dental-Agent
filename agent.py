import asyncio
import base64
import logging
import os
from pathlib import Path
from typing import Literal
from zoneinfo import ZoneInfo

import httpx
from dotenv import load_dotenv

from livekit import api, agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io, function_tool, metrics
from livekit.agents.beta.tools import EndCallTool
from livekit.plugins import noise_cancellation, silero, deepgram, google, openai
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.agents import llm as llm_mod, stt as stt_mod
from livekit.protocol.sip import TransferSIPParticipantRequest

logger = logging.getLogger("modera-dental")

load_dotenv(".env.local")


# ============================================================
# Langfuse / OpenTelemetry setup
# ============================================================

def _setup_langfuse_tracing():
    """Configure OTEL TracerProvider to export spans to Langfuse.

    If LANGFUSE_PUBLIC_KEY is not set, tracing is silently skipped.
    """
    public_key = os.environ.get("LANGFUSE_PUBLIC_KEY", "")
    secret_key = os.environ.get("LANGFUSE_SECRET_KEY", "")
    base_url = os.environ.get("LANGFUSE_BASE_URL", "")

    if not public_key or not secret_key:
        logger.info("Langfuse keys not configured — OTEL tracing disabled")
        return

    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

        auth_token = base64.b64encode(f"{public_key}:{secret_key}".encode()).decode()

        exporter = OTLPSpanExporter(
            endpoint=f"{base_url}/api/public/otel/v1/traces",
            headers={"Authorization": f"Basic {auth_token}"},
        )

        provider = TracerProvider()
        provider.add_span_processor(BatchSpanProcessor(exporter))
        trace.set_tracer_provider(provider)

        logger.info(f"Langfuse OTEL tracing enabled → {base_url}")
    except Exception as e:
        logger.warning(f"Failed to initialize Langfuse tracing: {e}")


_setup_langfuse_tracing()

# Load instructions from external prompt file
PROMPT_FILE = Path(__file__).parent / "prompt.md"
INSTRUCTIONS = PROMPT_FILE.read_text(encoding="utf-8")

# Webhook endpoints
APPOINTMENT_WEBHOOK_URL = os.environ.get("APPOINTMENT_WEBHOOK_URL", "")
RESCHEDULE_WEBHOOK_URL = os.environ.get("RESCHEDULE_WEBHOOK_URL", "")
CANCEL_WEBHOOK_URL = os.environ.get("CANCEL_WEBHOOK_URL", "")
LOOKUP_WEBHOOK_URL = os.environ.get("LOOKUP_WEBHOOK_URL", "")
AVAILABILITY_WEBHOOK_URL = os.environ.get("AVAILABILITY_WEBHOOK_URL", "")

# Phone number the agent transfers callers to when escalating to a human
CLINIC_TRANSFER_NUMBER = os.environ.get("CLINIC_TRANSFER_NUMBER", "")
if CLINIC_TRANSFER_NUMBER and not CLINIC_TRANSFER_NUMBER.startswith(("tel:", "sip:")):
    CLINIC_TRANSFER_NUMBER = f"tel:{CLINIC_TRANSFER_NUMBER}"

if not CLINIC_TRANSFER_NUMBER:
    logger.warning("CLINIC_TRANSFER_NUMBER not configured — transfers will fail")

# Human-readable phone number for fallback messages
CLINIC_PHONE_DISPLAY = os.environ.get("CLINIC_PHONE_DISPLAY", "the clinic")
# Valid service types based on clinic offerings
ServiceType = Literal[
    "Orthodontics Consultation",
    "Routine Checkup",
    "Dental Implants Consultation",
    "Cosmetic Dentistry Consultation",
    "Teeth Whitening",
    "Crown Fitting",
    "Root Canal Treatment",
    "New Patient Exam",
    "Emergency / Same-Day",
]

UrgencyLevel = Literal["Low", "Medium", "High"]


def _format_phone(phone: str) -> str:
    """Format phone number to (XXX) XXX-XXXX"""
    # Remove all non-digit characters
    digits = "".join(filter(str.isdigit, phone))
    # If we have 11 digits starting with 1, remove the 1
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return phone


@function_tool()
async def check_availability(
    preferred_date: str,
    service_type: ServiceType,
) -> str:
    """
    Check available appointment slots for a given date and service type.

    Call this tool BEFORE booking to verify the requested time slot is available.
    If the preferred time is unavailable, suggest the returned alternatives to the caller.

    Args:
        preferred_date: The date to check in ISO format (e.g., 2026-06-15)
        service_type: The type of appointment to check availability for

    Returns:
        Available time slots for the requested date, or alternative dates if fully booked.
    """
    if not AVAILABILITY_WEBHOOK_URL:
        # If no availability endpoint is configured, fall back to business-hours validation
        return (
            "Availability checking is not configured. "
            "Please confirm the appointment is during business hours "
            "(Monday-Friday, 9:30 AM - 5:00 PM) and proceed with booking."
        )

    params = {
        "date": preferred_date,
        "service_type": service_type,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(AVAILABILITY_WEBHOOK_URL, params=params)
            response.raise_for_status()
            data = response.json()

            if isinstance(data, dict) and "available_slots" in data:
                slots = data["available_slots"]
                if not slots:
                    alt = data.get("next_available", "the next business day")
                    return (
                        f"There are no available slots on {preferred_date} for {service_type}. "
                        f"The next available opening is {alt}. "
                        "Please suggest this alternative to the caller."
                    )
                slot_list = ", ".join(slots[:5])  # Show up to 5 options
                return f"Available slots on {preferred_date}: {slot_list}"

            # Fallback for simple list response
            if isinstance(data, list):
                if not data:
                    return f"No available slots on {preferred_date}. Please suggest another date."
                return f"Available slots on {preferred_date}: {', '.join(str(s) for s in data[:5])}"

            return f"Availability info: {data}"
    except httpx.HTTPStatusError as e:
        return f"Unable to check availability right now. Please proceed with the requested time and we will confirm. Error: {e.response.status_code}"
    except Exception:
        return "Unable to check availability right now. Please proceed with the requested time and we will confirm."


@function_tool()
async def create_appointment(
    full_name: str,
    phone: str,
    email: str,
    is_new_customer: bool,
    service_type: ServiceType,
    scheduled_at: str,
    reason: str,
    urgency: UrgencyLevel = "Medium",
) -> str:
    """
    Create a new appointment for a patient at Modera Dental Clinic.

    Call this tool when you have collected all the necessary information from the caller
    to schedule their appointment. Make sure to confirm the details with the caller before calling this tool.

    Args:
        full_name: The patient's full name (first and last name)
        phone: The patient's phone number with country code (e.g., 305xxxxxxx)
        email: The patient's email address
        is_new_customer: True if this is a new patient, False if they are an existing patient
        service_type: The type of appointment service requested
        scheduled_at: The appointment date and time in ISO format (e.g., 2026-02-10T09:00)
        reason: A brief description of why the patient is coming in
        urgency: The urgency level of the appointment (Low, Medium, or High)

    Returns:
        A confirmation message to relay to the caller
    """
    payload = {
        "tool": "create_appointment",
        "args": {
            "customer": {
                "full_name": full_name,
                "phone": _format_phone(phone),
                "email": email,
                "is_new_customer": is_new_customer,
            },
            "appointment": {
                "service_type": service_type,
                "datetime": scheduled_at,
                "reason": reason,
                "urgency": urgency,
            },
            "source": "ai_receptionist_voice",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(APPOINTMENT_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            return f"Appointment successfully scheduled for {full_name} on {scheduled_at}. A confirmation will be sent to {phone}."
    except httpx.HTTPStatusError as e:
        return f"I apologize, but I was unable to complete the booking at this moment. Please try again or call us directly at {CLINIC_PHONE_DISPLAY}. Error: {e.response.status_code}"
    except Exception as e:
        return f"I apologize, but there was an issue scheduling the appointment. Please call us directly at {CLINIC_PHONE_DISPLAY} to complete your booking."


@function_tool()
async def lookup_appointment(
    full_name: str,
    phone: str,
) -> str:
    """
    Look up an existing appointment for a patient.

    Args:
        full_name: The patient's full name
        phone: The patient's phone number (10 digits, e.g., 3051234567)

    Returns:
        Details of the found appointment(s) or a message indicating no appointment was found.
    """
    params = {
        "full_name": full_name,
        "phone": _format_phone(phone),
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(LOOKUP_WEBHOOK_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            if isinstance(data, list) and data:
                 results = []
                 for item in data:
                     # Handle nested appointments list (new format)
                     if "appointments" in item and isinstance(item["appointments"], list):
                         for apt in item["appointments"]:
                             results.append(f"- ID {apt.get('appointment_id')}: {apt.get('service_type')} on {apt.get('date')} at {apt.get('time')}")
                     # Handle flat list (previous format fallback)
                     elif "appointment_id" in item:
                         results.append(f"- ID {item.get('appointment_id')}: {item.get('service_type')} on {item.get('date')} at {item.get('time')}")
                 
                 if results:
                     return "Found the following appointments:\n" + "\n".join(results)
                 else:
                     return "I found your patient record, but I don't see any upcoming appointments."
            elif isinstance(data, list) and not data:
                 return "I couldn't find any appointments with those details."
            
            # Fallback for structured object or unexpected format
            return data.get("message", f"Found appointment: {data}")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return "I couldn't find an appointment with those details."
        return f"I encountered an error looking up the appointment. Error: {e.response.status_code}"
    except Exception:
        return "I apologize, but I'm having trouble accessing the appointment records right now."


@function_tool()
async def reschedule_appointment(
    appointment_id: str,
    new_datetime: str,
) -> str:
    """
    Reschedule an existing appointment to a new date and time.

    Args:
        appointment_id: The ID of the appointment to reschedule (returned from lookup_appointment)
        new_datetime: The new date and time in ISO format (e.g., 2026-02-15T14:00)

    Returns:
        A confirmation message of the rescheduling.
    """
    payload = {
        "appointment_id": appointment_id,
        "new_datetime": new_datetime,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.put(RESCHEDULE_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            return f"Appointment successfully rescheduled to {new_datetime}. A new confirmation will be sent."
    except httpx.HTTPStatusError as e:
        return f"I failed to reschedule the appointment. Error: {e.response.status_code}"
    except Exception:
        return "I apologize, but I was unable to reschedule the appointment at this time."


@function_tool()
async def cancel_appointment(
    appointment_id: str,
) -> str:
    """
    Cancel an existing appointment.

    Args:
        appointment_id: The ID of the appointment to cancel (returned from lookup_appointment)

    Returns:
        A confirmation message of the cancellation.
    """
    payload = {
        "appointment_id": appointment_id,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(CANCEL_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            return "Appointment successfully cancelled."
    except httpx.HTTPStatusError as e:
        return f"I failed to cancel the appointment. Error: {e.response.status_code}"
    except Exception:
        return "I apologize, but I was unable to cancel the appointment at this time."


class Assistant(Agent):
    def __init__(self, room: rtc.Room) -> None:
        self._room = room
        
        # Dynamic context for the agent — pinned to clinic timezone
        from datetime import datetime as _dt
        _clinic_tz = ZoneInfo("America/New_York")
        current_time_str = _dt.now(tz=_clinic_tz).strftime("%A, %B %d, %Y, at %I:%M %p %Z")
        dynamic_instructions = f"{INSTRUCTIONS}\n\n## Current Time Context\n\nThe current date and time is: {current_time_str}.\nUse this as 'today' for all scheduling. If a user says 'tomorrow' or 'next Tuesday', calculate the date relative to this timestamp."

        super().__init__(
            instructions=dynamic_instructions,
            tools=[
                check_availability,
                create_appointment,
                lookup_appointment,
                reschedule_appointment,
                cancel_appointment,

                EndCallTool(
                    end_instructions="Thank the caller warmly for calling Modera Dental Clinic and wish them a great day.",
                    delete_room=True,
                ),
            ],
        )

    @function_tool()
    async def _transfer_to_human(self, reason: str) -> str:
        """Transfer the caller to a live staff member at Modera Dental Clinic.

        Use this tool when:
        - The caller explicitly asks to speak to a real person
        - The situation requires human judgment (billing disputes, complaints, complex medical questions)
        - You are unable to help the caller after multiple attempts
        - There is a medical emergency that needs immediate human attention

        Before calling this tool, let the caller know you are transferring them.

        Args:
            reason: Brief description of why the transfer is needed

        Returns:
            A status message about the transfer
        """
        # Find the SIP participant (the caller) in the room
        sip_participant = None
        for p in self._room.remote_participants.values():
            if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP:
                sip_participant = p
                break

        if sip_participant is None:
            logger.warning("No SIP participant found — cannot transfer")
            return (
                "I'm sorry, I'm unable to transfer the call right now. "
                f"Please call us directly at {CLINIC_PHONE_DISPLAY}."
            )

        try:
            async with api.LiveKitAPI() as lk:
                await lk.sip.transfer_sip_participant(
                    TransferSIPParticipantRequest(
                        room_name=self._room.name,
                        participant_identity=sip_participant.identity,
                        transfer_to=CLINIC_TRANSFER_NUMBER,
                        play_dialtone=True,
                    )
                )
            logger.info(f"Call transfer initiated (room={self._room.name})")
            return "The call is being transferred to the front desk now."
        except Exception as e:
            logger.error(f"Transfer failed: {e}")
            return (
                "I'm sorry, I wasn't able to complete the transfer. "
                f"Please call us directly at {CLINIC_PHONE_DISPLAY}."
            )


def setup(proc: agents.JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server = AgentServer(setup_fnc=setup)


@server.rtc_session()
async def my_agent(ctx: agents.JobContext):
    # --- Extract caller identity ---
    caller_phone = "unknown"
    channel = "web"

    for p in ctx.room.remote_participants.values():
        if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP:
            channel = "sip"
            # SIP participants carry the caller's phone in attributes
            sip_attrs = p.attributes or {}
            caller_phone = (
                sip_attrs.get("sip.callerNumber")
                or sip_attrs.get("sip.phoneNumber")
                or p.identity
                or "unknown"
            )
            break

    # Tag the current OTEL trace with caller info for Langfuse
    try:
        from opentelemetry import trace as otel_trace
        span = otel_trace.get_current_span()
        if span and span.is_recording():
            span.set_attribute("caller.phone", caller_phone)
            span.set_attribute("caller.channel", channel)
            span.set_attribute("livekit.room", ctx.room.name or "")
    except Exception:
        pass  # Tracing is optional — never break the call

    logger.info(f"Session started (room={ctx.room.name}, channel={channel})")

    # --- Provider fallback chains ---
    fallback_stt = stt_mod.FallbackAdapter(
        stt=[
            deepgram.STT(model="nova-3"),
        ],
        attempt_timeout=10.0,
        max_retry_per_stt=1,
    )

    fallback_llm = llm_mod.FallbackAdapter(
        llm=[
            google.LLM(model="gemini-3-flash-preview"),
            openai.LLM(model="gpt-4.1-mini"),
        ],
        attempt_timeout=10.0,
        max_retry_per_llm=1,
    )

    session = AgentSession(
        stt=fallback_stt,
        llm=fallback_llm,
        tts=deepgram.TTS(
            model="aura-2-thalia-en",
        ),
        vad=ctx.proc.userdata["vad"],
        turn_detection=MultilingualModel(),
        # Built-in silence detection: after 15s of no speech the SDK
        # transitions the user state to "away" and fires user_state_changed.
        user_away_timeout=15,
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(room=ctx.room),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVCTelephony()
                if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                else noise_cancellation.BVC(),
            ),
        ),
    )

    await session.generate_reply(
        instructions="Greet the caller warmly as the Modera Dental Clinic virtual assistant and ask how you can help them today."
    )

    # --- Inactivity monitor (SDK-native pattern) ---
    # Uses the built-in user_away_timeout above to detect silence via VAD.
    # When the user goes silent for 15s the SDK fires user_state_changed
    # with new_state="away".  We then prompt up to 2 times before ending.
    _inactivity_task: asyncio.Task | None = None
    MAX_IDLE_PROMPTS = 2
    IDLE_PROMPT_INTERVAL = 10  # seconds between check-in prompts

    async def _idle_check_in():
        """Prompt the silent caller, then end the call if no response."""
        try:
            for attempt in range(1, MAX_IDLE_PROMPTS + 1):
                if attempt < MAX_IDLE_PROMPTS:
                    await session.generate_reply(
                        instructions=(
                            "The caller has been silent for a while. "
                            "Gently ask if they are still there."
                        )
                    )
                else:
                    await session.generate_reply(
                        instructions=(
                            "The caller has not responded after being asked. "
                            "Say goodbye politely and end the call."
                        )
                    )
                    # Give TTS time to finish speaking before shutdown
                    await asyncio.sleep(5)
                    session.shutdown()
                    return

                await asyncio.sleep(IDLE_PROMPT_INTERVAL)
        except asyncio.CancelledError:
            pass  # User resumed — task was cancelled, nothing to do

    @session.on("user_state_changed")
    def _on_user_state_changed(ev):
        nonlocal _inactivity_task

        if ev.new_state == "away":
            # User went silent — start the check-in loop
            if _inactivity_task is None or _inactivity_task.done():
                _inactivity_task = asyncio.create_task(_idle_check_in())
        else:
            # User is back (speaking / listening) — cancel any pending prompts
            if _inactivity_task is not None and not _inactivity_task.done():
                _inactivity_task.cancel()
                _inactivity_task = None

    # --- Metrics collection ---
    @session.on("metrics_collected")
    def _on_metrics(ev: metrics.AgentMetrics):
        metrics.log_metrics(ev)



if __name__ == "__main__":
    agents.cli.run_app(server)

