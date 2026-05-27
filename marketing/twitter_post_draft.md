# Twitter / X Post Drafts

Twitter requires brevity and visuals. Use a **thread** for the full story, but the first tweet must be a standalone "hook" with a video.

**Goal:** Viral reach and networking with tech twitter / AI twitter.
**Strategy:** "Show, don't tell." The video is 90% of the value.

---

## Option 1: The "Viral Demo" Thread (Recommended)
*Best for: Maximum engagement. Requires a 30-45s screen recording.*

**Tweet 1/5 (The Hook):**
I finally may have killed the "Press 1 for Appointments" phone tree. 📞💀

I built a voice AI demo for a dental clinic context that handles real calls, checks the calendar, and books appointments in <500ms.

It handles interruptions, accents, and "umms" naturally.

Here's the demo: 👇 
(Attach Video)

**Tweet 2/5:**
The stack:
🧠 Brain: Google Gemini 
🗣️ Speech: Deepgram Nova-3 (STT) + Aura (TTS)
⚡ Transport: LiveKit Agents (Python)
📞 Phone: Twilio SIP Trunking

The hardest part? Latency. Standard APIs are too slow for voice-to-voice.

**Tweet 3/5:**
Most "AI voice" bots feel like turn-based RPGs. You speak, wait 3s, it speaks.

We used a duplex stream to allow the user to *interrupt* the bot mid-sentence. If you say "Wait, actually...", it stops instantly.

**Tweet 4/5:**
Safety first:
It doesn't hallucinate slots. I built a strict tool-calling layer that queries the real practice management database before confirming anything.

If it gets stuck? One-click SIP transfer to the front desk. 🤝

**Tweet 5/5:**
I'm looking to pilot this with a real clinic or service business this month.

If you're tired of missed calls, DM me and let's test it out. 
Code snippets/details in the next reply 🧵

---

## Option 2: The "Humble Brag" Single Tweet
*Best for: A quick update to keep your feed active.*

**Tweet:**
POV: You just built your first production-ready Voice AI agent. 🤖🦷

Capable of handling 50+ calls/day for a dental clinic.
- Latency: ~400ms
- Stack: Python, LiveKit, Gemini
- Vibe: Helpful receptionist, not "robot"

RIP to the old phone tree. 👋

(Attach a screenshot of the logs or the "Active Rooms" dashboard)

---

## Option 3: The "Indie Hacker" Angle
*Best for: Inspiring other devs and finding collaborators.*

**Tweet:**
Spent the weekend optimizing VAD (Voice Activity Detection) curves for a dental AI. 

If the sensitivity is too high, it interrupts the user when they breathe. Too low, and it talks over them.

Found the sweet spot with Silero VAD + LiveKit's new Python agents framework. 

Voice AI is finally usable in production. Who else is building with this?
