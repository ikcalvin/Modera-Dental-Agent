# Hacker News Post Drafts

Here are three options for your Hacker News post, ranging from "Technical Show & Tell" to "Business Case".

**Goal:** Drive traffic and leads for your AI development services.
**Strategy:** HN users love technical details, open source (or "open architecture"), and real-world results. Avoid pure sales pitches; instead, share "war stories" of building it.

---

## Option 1: The "Show HN" / Technical Deep Dive (Recommended)
*Best for: Engaging engineers and potential tech-forward clients. Focuses on the "how".*

**Title:** Show HN: I built a voice AI receptionist for a dental clinic (Demo) using LiveKit & Python

**Url:** (Link to your landing page or a blog post describing the architecture)

**Text:**
Hey HN,

I recently built a production-ready voice AI agent demo for a dental clinic context (Modera Dental) to handle appointment bookings and general inquiries. I wanted to share the stack and what I learned about architecting voice AI for real-world scenarios.

**The Stack:**
*   **Transport:** LiveKit (WebRTC/SIP) for low-latency audio streaming.
*   **STT/TTS:** Deepgram Nova-3 and Aura (latency is critical here).
*   **LLM:** Google Gemini Flash (fast & cheap) for the reasoning loop.
*   **Backend:** Python with `livekit-agents`.
*   **Telephony:** Twilio SIP trunking into LiveKit.

**Key Challenges & Solutions:**
*   **Latency:** The biggest hurdle. We optimized the turn-taking pipeline to get sub-500ms response times so it doesn't feel like a walkie-talkie.
*   **Hallucinations:** Dental appointments are high-stakes. I implemented strict tool-calling (RAG) that actually checks the practice management software (PMS) for slots before confirming. It doesn't just "guess" availability.
*   **"Umms" & Interruptions:** Used Silero VAD (Voice Activity Detection) to handle interruptions naturally. If the user speaks over the bot, it stops talking immediately.
*   **Human Handoff:** If the agent gets stuck or the user asks for a human, it performs a SIP transfer to the front desk.

It's designed to handle real-world edge cases like interruptions and spam, and can book simple checkups, which would free up staff to focus on in-person patients.

I’m now looking for clinics to pilot this with. If you're interested in the technical nitty-gritty or need something like this regarding **HIPAA compliance** or **integration details**, I'm happy to answer questions in the comments!

(Link to your contact/agency page)

---

## Option 2: The "Business Results" Approach
*Best for: Attracting business owners and non-technical founders.*

**Title:** Automating 80% of dental clinic calls with a Python voice agent (Demo)

**Text:**
I spent the last month building a voice AI purpose-built for busy dental offices. Front desks are often overwhelmed, missing ~25% of calls during peak hours.

I built a Python-based agent (LiveKit + Gemini + Deepgram) that handles:
1.  **Scheduling:** Hooks directly into their DB to book/reschedule.
2.  **Triage:** Differentiates between a "toothache" (urgent) and "teeth whitening" (cosmetic) and prioritizes accordingly.
3.  **FAQ:** Answers hours, location, and insurance questions.

**The Goal:** 
Eliminate missed calls. The staff only needs to jump in for complex insurance issues or when the caller explicitly asks for a human (I built a seamless SIP handoff).

The hardest part wasn't the LLM—it was the **latency** and **interruptibility**. Users hate waiting 2 seconds for a reply. I got it down to ~400ms using WebRTC instead of standard programmable voice APIs.

I'm looking for beta testers/partners to deploy this live. Happy to discuss the architecture or the business side of "selling AI to SMBs".

---

## Option 3: The "Provocative/Discussion" Approach
*Best for: Getting a lot of comments/debate (risky but high visibility).*

**Title:** Why traditional IVR is dead: My experience replacing a phone tree with an LLM (Demo)

**Text:**
Most people hate calling doctors because of "Press 1 for appointments...". 

I built a fully conversational agent to replace standard IVR systems. 
*   **Old way:** 2-minute menu navigation.
*   **New way:** "I need a root canal next Tuesday." -> "Okay, checking availability..."

**The Tech:**
We used LiveKit for the real-time transport layer because standard telephony APIs (Twilio Voice alone) were too slow for natural conversation. The agent uses function calling to act as a real database client, not just a chatbot.

It turns out, the "uncanny valley" of voice is solvable if you focus purely on **latency** and **interruptibility**.

I'm looking to apply this stack to other verticals. What other industries are desperate to kill their phone trees?

----------------------------------------------------------------------
**Advice for posting:**
1.  **Be present:** Stay in the comments for the first 2 hours. Answer every technical question honestly.
2.  **Don't over-sell:** HN hates marketing fluff. Be humble about the bugs you faced.
3.  **Link responsibly:** Put your "Hire me" link at the bottom or in your profile "About" section, rather than making the whole post an ad.
