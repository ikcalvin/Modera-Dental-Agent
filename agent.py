from pathlib import Path
from typing import Literal

import httpx
from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io, function_tool
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv(".env.local")

# Load instructions from external prompt file
PROMPT_FILE = Path(__file__).parent / "prompt.md"
INSTRUCTIONS = PROMPT_FILE.read_text(encoding="utf-8")

# Webhook endpoint for appointment creation
APPOINTMENT_WEBHOOK_URL = "https://kcalvin.myvnc.com/webhook-test/create_appointment"

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
        return f"I apologize, but I was unable to complete the booking at this moment. Please try again or call us directly at (305) 485-8427. Error: {e.response.status_code}"
    except Exception as e:
        return f"I apologize, but there was an issue scheduling the appointment. Please call us directly at (305) 485-8427 to complete your booking."


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=INSTRUCTIONS,
            tools=[create_appointment],
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
        agent=Assistant(),
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


if __name__ == "__main__":
    agents.cli.run_app(server)
