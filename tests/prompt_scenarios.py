"""
Prompt regression test scenarios for the Modera Dental Agent.

These scenarios define expected agent behavior for common call patterns.
They are designed to be used with an LLM evaluation framework (e.g., Promptfoo,
Braintrust) or can be run manually against the agent.

Each scenario includes:
- description: What the scenario tests
- caller_messages: Simulated caller utterances in order
- expected_tool: Which tool the agent should ultimately call (if any)
- expected_fields: Key fields the tool should be called with
- must_not: Things the agent should NOT do
- notes: Additional context for human reviewers

Usage:
  1. Load these scenarios into your eval framework
  2. Feed caller_messages sequentially to the agent
  3. Assert the agent calls the expected tool with expected fields
  4. Assert none of the must_not conditions are violated
"""

from copy import deepcopy

SCENARIOS = [
    # ──────────────────────────────────────────────
    # BOOKING FLOWS
    # ──────────────────────────────────────────────
    {
        "id": "book_001",
        "description": "Happy path: New patient books a routine checkup",
        "caller_messages": [
            "Hi, I'd like to schedule a cleaning please",
            "My name is Maria Garcia",
            "305-555-1234",
            "maria@gmail.com",
            "Yes, I'm a new patient",
            "Next Tuesday at 10am would be great",
            "Yes, that all sounds correct",
        ],
        "expected_tool": "create_appointment",
        "expected_fields": {
            "full_name": "Maria Garcia",
            "service_type": "Routine Checkup",
            "is_new_customer": True,
        },
        "must_not": [
            "read a list of service types to the caller",
            "end the call before confirming details",
        ],
    },
    {
        "id": "book_002",
        "description": "Emergency booking with urgency detection",
        "caller_messages": [
            "I have really bad tooth pain, it started this morning and I can barely eat",
            "John Davis",
            "305-555-9876",
            "john.davis@email.com",
            "No, I've been here before",
            "As soon as possible, today if you can",
            "Yes, please go ahead",
        ],
        "expected_tool": "create_appointment",
        "expected_fields": {
            "service_type": "Emergency / Same-Day",
            "urgency": "High",
            "is_new_customer": False,
        },
        "must_not": [
            "suggest a non-emergency appointment type",
            "ask if the pain is urgent when caller already expressed urgency",
        ],
    },
    {
        "id": "book_003",
        "description": "Ambiguous service type — agent should ask clarifying question",
        "caller_messages": [
            "I want to fix my teeth, they look bad",
        ],
        "expected_tool": None,  # Should ask a follow-up, not immediately book
        "expected_fields": {},
        "must_not": [
            "immediately assume a service type",
            "read a list of options",
        ],
        "notes": "Agent should ask something like 'Could you tell me more about what's going on?' to differentiate between cosmetic, orthodontics, or other needs.",
    },
    {
        "id": "book_004",
        "description": "Caller provides email as 'I don't have one'",
        "caller_messages": [
            "I need a checkup",
            "Roberto Mendez",
            "305-555-4321",
            "I don't have an email",
            "I've been coming here for years",
            "Wednesday at 2pm",
            "Yes that's correct",
        ],
        "expected_tool": "create_appointment",
        "expected_fields": {
            "full_name": "Roberto Mendez",
            "email": "",  # Should handle gracefully
            "is_new_customer": False,
        },
        "must_not": [
            "refuse to book without email",
            "ask for email again after caller said they don't have one",
        ],
    },
    {
        "id": "book_005",
        "description": "Weekend date rejection — agent should redirect to weekday",
        "caller_messages": [
            "I'd like to schedule a teeth whitening",
            "Ana Rodriguez",
            "305-555-7777",
            "ana@email.com",
            "No, I'm new",
            "Saturday morning would be great",
        ],
        "expected_tool": None,  # Should not book, should inform about weekend
        "expected_fields": {},
        "must_not": [
            "book an appointment on Saturday",
            "book an appointment on Sunday",
        ],
        "notes": "Agent should inform caller the clinic is closed on weekends and suggest Monday-Friday.",
    },

    # ──────────────────────────────────────────────
    # MANAGE EXISTING APPOINTMENTS
    # ──────────────────────────────────────────────
    {
        "id": "manage_001",
        "description": "Caller wants to reschedule an existing appointment",
        "caller_messages": [
            "I need to reschedule my appointment",
            "Sarah Johnson",
            "305-555-2222",
        ],
        "expected_tool": "lookup_appointment",
        "expected_fields": {
            "full_name": "Sarah Johnson",
        },
        "must_not": [
            "try to book a new appointment without looking up first",
            "ask for email when managing existing appointments",
        ],
    },
    {
        "id": "manage_002",
        "description": "Caller wants to cancel an appointment",
        "caller_messages": [
            "I want to cancel my appointment",
            "Mike Thompson, 305-555-3333",
        ],
        "expected_tool": "lookup_appointment",
        "expected_fields": {
            "full_name": "Mike Thompson",
        },
        "must_not": [
            "cancel without first looking up and confirming the appointment",
        ],
    },

    # ──────────────────────────────────────────────
    # INFORMATION REQUESTS
    # ──────────────────────────────────────────────
    {
        "id": "info_001",
        "description": "Caller asks about services — should inform, not book",
        "caller_messages": [
            "What kind of services do you offer?",
        ],
        "expected_tool": None,
        "expected_fields": {},
        "must_not": [
            "immediately try to collect booking info",
            "give specific prices",
        ],
        "notes": "Agent should describe services and offer to schedule a consultation.",
    },
    {
        "id": "info_002",
        "description": "Caller asks about business hours",
        "caller_messages": [
            "What are your hours?",
        ],
        "expected_tool": None,
        "expected_fields": {},
        "must_not": [
            "give wrong hours",
            "say the clinic is open on weekends",
        ],
        "notes": "Should state Mon-Thu 9:00 AM - 5:30 PM, Fri 9:00 AM - 4:30 PM, closed weekends.",
    },
    {
        "id": "info_003",
        "description": "Caller asks about pricing — should not provide specific prices",
        "caller_messages": [
            "How much does a teeth whitening cost?",
        ],
        "expected_tool": None,
        "expected_fields": {},
        "must_not": [
            "give a specific dollar amount",
            "make up pricing",
        ],
        "notes": "Should suggest an in-person consultation for pricing details.",
    },

    # ──────────────────────────────────────────────
    # ESCALATION
    # ──────────────────────────────────────────────
    {
        "id": "escalate_001",
        "description": "Caller explicitly asks for a real person",
        "caller_messages": [
            "I want to speak to a real person please",
        ],
        "expected_tool": "_transfer_to_human",
        "expected_fields": {},
        "must_not": [
            "refuse to transfer",
            "try to handle the request itself after explicit ask",
        ],
    },
    {
        "id": "escalate_002",
        "description": "Caller has a billing complaint — should escalate",
        "caller_messages": [
            "I got charged twice for my last visit and I'm very upset about it",
        ],
        "expected_tool": "_transfer_to_human",
        "expected_fields": {},
        "must_not": [
            "try to resolve billing disputes itself",
            "dismiss the caller's concern",
        ],
    },

    # ──────────────────────────────────────────────
    # BILINGUAL
    # ──────────────────────────────────────────────
    {
        "id": "lang_001",
        "description": "Caller speaks Spanish — agent should respond in Spanish",
        "caller_messages": [
            "Hola, necesito hacer una cita para una limpieza",
        ],
        "expected_tool": None,  # Should respond in Spanish first
        "expected_fields": {},
        "must_not": [
            "respond in English when caller speaks Spanish",
        ],
        "notes": "Agent should continue the conversation in Spanish.",
    },

    # ──────────────────────────────────────────────
    # EDGE CASES
    # ──────────────────────────────────────────────
    {
        "id": "edge_001",
        "description": "Caller says goodbye — agent should end call",
        "caller_messages": [
            "That's all I needed, thank you!",
            "Bye!",
        ],
        "expected_tool": "end_call",
        "expected_fields": {},
        "must_not": [
            "keep talking after caller says goodbye",
            "ask additional questions after farewell",
        ],
    },
    {
        "id": "edge_002",
        "description": "Caller asks one question at a time — agent should not dump all info",
        "caller_messages": [
            "I'd like to book an appointment",
        ],
        "expected_tool": None,
        "expected_fields": {},
        "must_not": [
            "ask for name, phone, email, and date all at once",
            "ask more than one question in the response",
        ],
        "notes": "Prompt says 'Ask ONE question at a time'. First response should only ask what they need help with.",
    },
]


def get_scenario_by_id(scenario_id: str) -> dict | None:
    """Retrieve a specific scenario by ID."""
    for s in SCENARIOS:
        if s["id"] == scenario_id:
            return deepcopy(s)
    return None


def get_scenarios_by_tool(tool_name: str | None) -> list[dict]:
    """Get all scenarios that expect a specific tool to be called."""
    return [deepcopy(s) for s in SCENARIOS if s["expected_tool"] == tool_name]


if __name__ == "__main__":
    print(f"Total scenarios: {len(SCENARIOS)}")
    print(f"  Booking:     {len(get_scenarios_by_tool('create_appointment'))}")
    print(f"  Lookup:      {len(get_scenarios_by_tool('lookup_appointment'))}")
    print(f"  Escalation:  {len(get_scenarios_by_tool('_transfer_to_human'))}")
    print(f"  Info (none): {len(get_scenarios_by_tool(None))}")
    print(f"  End call:    {len(get_scenarios_by_tool('end_call'))}")
