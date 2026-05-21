# Modera Dental — Prompt Evaluation Suite

Automated regression tests for the voice agent system prompt using [Promptfoo](https://www.promptfoo.dev/).

## Quick Start

```bash
# Install promptfoo
npm install -g promptfoo@latest

# Set your OpenAI API key
export OPENAI_API_KEY=sk-...

# Run all 26 scenarios
promptfoo eval --config evals/promptfooconfig.yaml

# View results in browser
promptfoo view
```

## What's Tested

26 scenarios across 10 categories:

| Category | Count | Tests |
|----------|-------|-------|
| Booking flows | 5 | Happy path, emergency, ambiguous, no email, weekend rejection |
| Adaptive flow | 2 | Info volunteered upfront, multiple details in one breath |
| Booking for others | 1 | Parent booking for child |
| Mid-flow corrections | 1 | Caller changes date mid-booking |
| Manage appointments | 2 | Reschedule lookup, cancel lookup |
| Information requests | 3 | Services, hours, pricing |
| Insurance questions | 3 | General, specific plan, uninsured |
| Dental anxiety | 2 | Fear of dentist, long gap between visits |
| After-hours | 1 | Booking when office is closed |
| Escalation | 2 | Ask for human, billing complaint |
| Bilingual | 1 | Spanish-speaking caller |
| Edge cases | 2 | Goodbye/end call, one question at a time |
| Tool-wait filler | 1 | Filler phrase before tool call |

## Assertion Types

- **`javascript`** — Checks tool calls (e.g., `create_appointment` called with correct fields)
- **`not-contains`** — Must-not violations (e.g., no dollar amounts for pricing)
- **`llm-rubric`** — LLM-judged behavioral checks (e.g., "is the response empathetic?")

## CI Integration

The GitHub Actions workflow (`.github/workflows/eval.yml`) runs automatically on:
- Pushes to `sml-upd` or `main` that touch `prompt.md`, `evals/`, or `agent.py`
- Pull requests targeting those branches

**Required secret:** `OPENAI_API_KEY` in your GitHub repository settings.

## Files

```
evals/
├── promptfooconfig.yaml   # Main configuration
├── tools.json             # OpenAI function schemas (7 tools)
├── tests.yaml             # All 27 test scenarios
└── README.md              # This file
```
