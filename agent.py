import asyncio
import logging
import os
from pathlib import Path
from typing import Literal

import httpx
from dotenv import load_dotenv

from livekit import api, agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io, function_tool
from livekit.agents.beta.tools import EndCallTool
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.protocol.sip import TransferSIPParticipantRequest

logger = logging.getLogger("modera-dental")

load_dotenv(".env.local")

# Load instructions from external prompt file
PROMPT_FILE = Path(__file__).parent / "prompt.md"
INSTRUCTIONS = PROMPT_FILE.read_text(encoding="utf-8")

# Webhook endpoint for appointment creation
APPOINTMENT_WEBHOOK_URL = os.environ.get("APPOINTMENT_WEBHOOK_URL", "")

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


@function_tool()
async def create_appointment(
    full_name: str,
    phone: str,
    email: str,
    is_new_customer: bool,
    service_type: ServiceType,
    datetime: str,
    reason: str,
    urgency: UrgencyLevel = "Medium",
) -> str:
    """
    Create a new appointment for a patient at Modera Dental Clinic.

    Call this tool when you have collected all the necessary information from the caller
    to schedule their appointment. Make sure to confirm the details with the caller before calling this tool.

    Args:
        full_name: The patient's full name (first and last name)
        phone: The patient's phone number with country code (e.g., +1305xxxxxxx)
        email: The patient's email address
        is_new_customer: True if this is a new patient, False if they are an existing patient
        service_type: The type of appointment service requested
        datetime: The appointment date and time in ISO format (e.g., 2026-02-10T09:00)
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
                "phone": phone,
                "email": email,
                "is_new_customer": is_new_customer,
            },
            "appointment": {
                "service_type": service_type,
                "datetime": datetime,
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
            return f"Appointment successfully scheduled for {full_name} on {datetime}. A confirmation will be sent to {phone}."
    except httpx.HTTPStatusError as e:
        return f"I apologize, but I was unable to complete the booking at this moment. Please try again or call us directly at {CLINIC_PHONE_DISPLAY}. Error: {e.response.status_code}"
    except Exception as e:
        return f"I apologize, but there was an issue scheduling the appointment. Please call us directly at {CLINIC_PHONE_DISPLAY} to complete your booking."


class Assistant(Agent):
    def __init__(self, room: rtc.Room) -> None:
        self._room = room
        
        # Dynamic context for the agent
        from datetime import datetime
        current_time_str = datetime.now().strftime("%A, %B %d, %Y, at %I:%M %p")
        dynamic_instructions = f"{INSTRUCTIONS}\n\n## Current Time Context\n\nThe current date and time is: {current_time_str}.\nUse this as 'today' for all scheduling. If a user says 'tomorrow' or 'next Tuesday', calculate the date relative to this timestamp."

        super().__init__(
            instructions=dynamic_instructions,
            tools=[
                create_appointment,

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
            logger.info(f"Transferred caller to {CLINIC_TRANSFER_NUMBER} — reason: {reason}")
            return "The call is being transferred to the front desk now."
        except Exception as e:
            logger.error(f"Transfer failed: {e}")
            return (
                "I'm sorry, I wasn't able to complete the transfer. "
                f"Please call us directly at {CLINIC_PHONE_DISPLAY}."
            )


server = AgentServer()


@server.rtc_session()
async def my_agent(ctx: agents.JobContext):
    session = AgentSession(
        stt="deepgram/nova-3:multi",
        llm="openai/gpt-4.1-mini",
        tts="cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
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

    # --- Inactivity monitor ---
    IDLE_TIMEOUT = 15  # seconds of silence before prompting
    idle_prompt_count = 0

    async def _inactivity_watcher():
        nonlocal idle_prompt_count
        while True:
            await asyncio.sleep(IDLE_TIMEOUT)
            if ctx.room.state != rtc.RoomState.ROOM_STATE_CONNECTED:
                break

            idle_prompt_count += 1
            try:
                if idle_prompt_count == 1:
                    await session.generate_reply(
                        instructions="The caller has been silent for a while. Gently ask if they are still there."
                    )
                elif idle_prompt_count >= 2:
                    await session.generate_reply(
                        instructions="The caller has not responded after being asked. Say goodbye politely and end the call."
                    )
                    break
            except RuntimeError:
                break

    watcher_task = asyncio.create_task(_inactivity_watcher())

    @session.on("user_input_transcribed")
    def _on_user_speech(ev):
        nonlocal idle_prompt_count
        if ev.is_final:
            idle_prompt_count = 0
            # restart the watcher
            watcher_task.cancel()

    @session.on("user_input_transcribed")
    def _restart_watcher(ev):
        nonlocal watcher_task
        if ev.is_final:
            watcher_task = asyncio.create_task(_inactivity_watcher())


if __name__ == "__main__":
    agents.cli.run_app(server)
