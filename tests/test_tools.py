"""
Unit tests for Modera Dental Agent tools and utilities.

Run with: uv run pytest tests/ -v
"""

import pytest
import httpx
import respx
from unittest.mock import AsyncMock, patch

# Import the functions under test
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from agent import _format_phone


# ============================================================
# _format_phone tests
# ============================================================


class TestFormatPhone:
    """Tests for phone number formatting utility."""

    def test_ten_digit_number(self):
        assert _format_phone("3055551234") == "(305) 555-1234"

    def test_eleven_digit_with_leading_one(self):
        assert _format_phone("13055551234") == "(305) 555-1234"

    def test_formatted_input_strips_and_reformats(self):
        assert _format_phone("(305) 555-1234") == "(305) 555-1234"

    def test_dashes_input(self):
        assert _format_phone("305-555-1234") == "(305) 555-1234"

    def test_spaces_input(self):
        assert _format_phone("305 555 1234") == "(305) 555-1234"

    def test_plus_one_prefix(self):
        assert _format_phone("+13055551234") == "(305) 555-1234"

    def test_short_number_returned_as_is(self):
        """Numbers that don't match 10-digit US format are returned unchanged."""
        assert _format_phone("12345") == "12345"

    def test_international_number_returned_as_is(self):
        assert _format_phone("+442071234567") == "+442071234567"

    def test_empty_string(self):
        assert _format_phone("") == ""

    def test_letters_stripped(self):
        """Non-digit characters are stripped during processing."""
        result = _format_phone("305-ABC-1234")
        # Only digits are kept: 3051234 → 7 digits → returned as-is
        assert result == "305-ABC-1234"


# ============================================================
# create_appointment tests
# ============================================================


@pytest.mark.asyncio
class TestCreateAppointment:
    """Tests for the create_appointment tool function."""

    @respx.mock
    async def test_successful_booking(self):
        """Successful webhook POST returns confirmation message."""
        from agent import create_appointment, APPOINTMENT_WEBHOOK_URL

        # Only run if webhook URL is configured
        if not APPOINTMENT_WEBHOOK_URL:
            pytest.skip("APPOINTMENT_WEBHOOK_URL not configured")

        respx.post(APPOINTMENT_WEBHOOK_URL).mock(
            return_value=httpx.Response(200, json={"success": True})
        )

        result = await create_appointment.handler(
            full_name="John Smith",
            phone="3055551234",
            email="john@example.com",
            is_new_customer=True,
            service_type="Routine Checkup",
            scheduled_at="2026-06-15T10:00",
            reason="Regular cleaning",
            urgency="Low",
        )

        assert "John Smith" in result
        assert "successfully scheduled" in result.lower()

    @respx.mock
    async def test_webhook_500_error(self):
        """Webhook 500 error returns user-friendly error message."""
        from agent import create_appointment

        with patch("agent.APPOINTMENT_WEBHOOK_URL", "https://test.example.com/hook"):
            respx.post("https://test.example.com/hook").mock(
                return_value=httpx.Response(500)
            )

            result = await create_appointment.handler(
                full_name="Jane Doe",
                phone="3055559999",
                email="jane@example.com",
                is_new_customer=False,
                service_type="Teeth Whitening",
                scheduled_at="2026-06-20T14:00",
                reason="Whitening session",
                urgency="Low",
            )

            assert "apologize" in result.lower() or "unable" in result.lower()

    @respx.mock
    async def test_webhook_timeout(self):
        """Webhook timeout returns user-friendly error message."""
        from agent import create_appointment

        with patch("agent.APPOINTMENT_WEBHOOK_URL", "https://test.example.com/hook"):
            respx.post("https://test.example.com/hook").mock(
                side_effect=httpx.ConnectTimeout("Connection timed out")
            )

            result = await create_appointment.handler(
                full_name="Bob Wilson",
                phone="3055558888",
                email="bob@example.com",
                is_new_customer=True,
                service_type="New Patient Exam",
                scheduled_at="2026-07-01T09:30",
                reason="First visit",
                urgency="Medium",
            )

            assert "apologize" in result.lower() or "issue" in result.lower()


# ============================================================
# lookup_appointment tests
# ============================================================


@pytest.mark.asyncio
class TestLookupAppointment:
    """Tests for the lookup_appointment tool function."""

    @respx.mock
    async def test_found_appointments_flat_format(self):
        """Lookup returns formatted list for flat appointment format."""
        from agent import lookup_appointment

        with patch("agent.LOOKUP_WEBHOOK_URL", "https://test.example.com/lookup"):
            respx.get("https://test.example.com/lookup").mock(
                return_value=httpx.Response(
                    200,
                    json=[
                        {
                            "appointment_id": "APT-001",
                            "service_type": "Routine Checkup",
                            "date": "2026-06-15",
                            "time": "10:00 AM",
                        }
                    ],
                )
            )

            result = await lookup_appointment.handler(
                full_name="John Smith",
                phone="3055551234",
            )

            assert "APT-001" in result
            assert "Routine Checkup" in result

    @respx.mock
    async def test_found_appointments_nested_format(self):
        """Lookup returns formatted list for nested appointment format."""
        from agent import lookup_appointment

        with patch("agent.LOOKUP_WEBHOOK_URL", "https://test.example.com/lookup"):
            respx.get("https://test.example.com/lookup").mock(
                return_value=httpx.Response(
                    200,
                    json=[
                        {
                            "appointments": [
                                {
                                    "appointment_id": "APT-002",
                                    "service_type": "Teeth Whitening",
                                    "date": "2026-07-01",
                                    "time": "2:00 PM",
                                }
                            ]
                        }
                    ],
                )
            )

            result = await lookup_appointment.handler(
                full_name="Jane Doe",
                phone="3055559999",
            )

            assert "APT-002" in result
            assert "Teeth Whitening" in result

    @respx.mock
    async def test_no_appointments_found(self):
        """Empty list returns 'no appointments' message."""
        from agent import lookup_appointment

        with patch("agent.LOOKUP_WEBHOOK_URL", "https://test.example.com/lookup"):
            respx.get("https://test.example.com/lookup").mock(
                return_value=httpx.Response(200, json=[])
            )

            result = await lookup_appointment.handler(
                full_name="Nobody",
                phone="3055550000",
            )

            assert "couldn't find" in result.lower()

    @respx.mock
    async def test_404_not_found(self):
        """404 response returns 'not found' message."""
        from agent import lookup_appointment

        with patch("agent.LOOKUP_WEBHOOK_URL", "https://test.example.com/lookup"):
            respx.get("https://test.example.com/lookup").mock(
                return_value=httpx.Response(404)
            )

            result = await lookup_appointment.handler(
                full_name="Nobody",
                phone="3055550000",
            )

            assert "couldn't find" in result.lower()


# ============================================================
# reschedule_appointment tests
# ============================================================


@pytest.mark.asyncio
class TestRescheduleAppointment:
    """Tests for the reschedule_appointment tool function."""

    @respx.mock
    async def test_successful_reschedule(self):
        from agent import reschedule_appointment

        with patch("agent.RESCHEDULE_WEBHOOK_URL", "https://test.example.com/reschedule"):
            respx.put("https://test.example.com/reschedule").mock(
                return_value=httpx.Response(200, json={"success": True})
            )

            result = await reschedule_appointment.handler(
                appointment_id="APT-001",
                new_datetime="2026-06-20T14:00",
            )

            assert "rescheduled" in result.lower()

    @respx.mock
    async def test_reschedule_failure(self):
        from agent import reschedule_appointment

        with patch("agent.RESCHEDULE_WEBHOOK_URL", "https://test.example.com/reschedule"):
            respx.put("https://test.example.com/reschedule").mock(
                return_value=httpx.Response(500)
            )

            result = await reschedule_appointment.handler(
                appointment_id="APT-001",
                new_datetime="2026-06-20T14:00",
            )

            assert "failed" in result.lower() or "error" in result.lower()


# ============================================================
# cancel_appointment tests
# ============================================================


@pytest.mark.asyncio
class TestCancelAppointment:
    """Tests for the cancel_appointment tool function."""

    @respx.mock
    async def test_successful_cancel(self):
        from agent import cancel_appointment

        with patch("agent.CANCEL_WEBHOOK_URL", "https://test.example.com/cancel"):
            respx.post("https://test.example.com/cancel").mock(
                return_value=httpx.Response(200, json={"success": True})
            )

            result = await cancel_appointment.handler(
                appointment_id="APT-001",
            )

            assert "cancelled" in result.lower()

    @respx.mock
    async def test_cancel_failure(self):
        from agent import cancel_appointment

        with patch("agent.CANCEL_WEBHOOK_URL", "https://test.example.com/cancel"):
            respx.post("https://test.example.com/cancel").mock(
                return_value=httpx.Response(500)
            )

            result = await cancel_appointment.handler(
                appointment_id="APT-001",
            )

            assert "failed" in result.lower() or "unable" in result.lower()
