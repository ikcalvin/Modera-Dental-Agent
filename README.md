# Modera Dental Clinic — AI Voice Receptionist

An AI-powered voice receptionist for Modera Dental Clinic, built with [LiveKit Agents](https://docs.livekit.io/agents). The agent answers phone calls, assists callers with service inquiries, and books appointments — all through natural voice conversation in English and Spanish.

## Features

- **Voice-first AI receptionist** — Natural, conversational phone experience powered by STT → LLM → TTS pipeline
- **Appointment booking** — Collects patient details step-by-step and submits to a webhook
- **Bilingual support** — Responds in English or Spanish based on the caller's language
- **Telephony ready** — Works with Twilio SIP trunks for real phone calls
- **Inactivity detection** — Prompts silent callers and gracefully ends unresponsive calls
- **End call handling** — Politely wraps up and disconnects when the conversation is complete

## Tech Stack

| Component | Provider |
|-----------|----------|
| **STT** | Deepgram Nova 3 (multilingual) |
| **LLM** | OpenAI GPT-4.1-mini |
| **TTS** | Cartesia Sonic 3 |
| **VAD** | Silero |
| **Turn Detection** | LiveKit Multilingual Model |
| **Noise Cancellation** | LiveKit BVC / BVC Telephony |
| **Telephony** | Twilio Elastic SIP Trunk → LiveKit SIP |

## Project Structure

```
├── agent.py              # Main agent logic, tools, and session handler
├── prompt.md             # AI persona, clinic info, and conversation flow
├── pyproject.toml        # Python dependencies
├── .env.local.example    # Environment variable template
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Prerequisites

- [Python 3.12+](https://www.python.org/)
- [uv](https://docs.astral.sh/uv/) — Python package manager
- [LiveKit Cloud](https://cloud.livekit.io/) account
- [OpenAI API key](https://platform.openai.com/)
- [Twilio](https://www.twilio.com/) account (for phone calls)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/modera-dental.git
cd modera-dental
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_api_key
APPOINTMENT_WEBHOOK_URL=https://your-webhook-endpoint.com/create_appointment
```

### 3. Install dependencies

```bash
uv sync
```

### 4. Download model files

```bash
uv run agent.py download-files
```

## Running the Agent

### Console mode (local testing with microphone)

```bash
uv run agent.py console
```

### Development mode (connects to LiveKit Cloud)

```bash
uv run agent.py dev
```

### Production mode

```bash
uv run agent.py start
```

## Telephony Setup (Twilio)

To receive real phone calls, connect a Twilio SIP trunk to LiveKit:

1. **Twilio** — Create an Elastic SIP Trunk and add your LiveKit SIP endpoint as the Origination URI
2. **Twilio** — Buy a phone number and route it to your SIP trunk
3. **LiveKit Cloud** — Create an Inbound SIP Trunk with your Twilio phone number
4. **LiveKit Cloud** — Create a Dispatch Rule with room prefix `call-`
5. **Deploy** — Run the agent with `uv run agent.py start`

For detailed instructions, see the [LiveKit Twilio SIP Setup Guide](https://docs.livekit.io/sip/quickstarts/configuring-twilio-trunk).

## Appointment Webhook

When the agent books an appointment, it sends a POST request to `APPOINTMENT_WEBHOOK_URL` with this payload:

```json
{
  "tool": "create_appointment",
  "args": {
    "customer": {
      "full_name": "John Smith",
      "phone": "+13055551234",
      "email": "john@example.com",
      "is_new_customer": true
    },
    "appointment": {
      "service_type": "Routine Checkup",
      "datetime": "2026-02-15T10:00",
      "reason": "Regular cleaning",
      "urgency": "Low"
    },
    "source": "ai_receptionist_voice"
  }
}
```

### Available Service Types

- Orthodontics Consultation
- Routine Checkup
- Dental Implants Consultation
- Cosmetic Dentistry Consultation
- Teeth Whitening
- Crown Fitting
- Root Canal Treatment
- New Patient Exam
- Emergency / Same-Day

## Customization

- **`prompt.md`** — Edit the clinic name, services, business hours, and conversation flow
- **`agent.py`** — Modify tools, add new capabilities, or change AI providers

## License

MIT
