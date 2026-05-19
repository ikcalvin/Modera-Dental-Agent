import { NextResponse } from "next/server";
import { z } from "zod";

// --- Request schema validation ---
const BookingSchema = z.object({
    tool: z.literal("create_appointment"),
    args: z.object({
        customer: z.object({
            full_name: z.string().min(2).max(100),
            phone: z.string().min(7).max(20),
            email: z.string().email().max(254).or(z.literal("")),
            is_new_customer: z.boolean(),
        }),
        appointment: z.object({
            service_type: z.enum([
                "Orthodontics Consultation",
                "Routine Checkup",
                "Dental Implants Consultation",
                "Cosmetic Dentistry Consultation",
                "Teeth Whitening",
                "Crown Fitting",
                "Root Canal Treatment",
                "New Patient Exam",
                "Emergency / Same-Day",
            ]),
            datetime: z.string().min(10).max(30),
            reason: z.string().max(500).default(""),
            urgency: z.enum(["Low", "Medium", "High"]).default("Medium"),
        }),
        source: z.string().max(50).default("web_booking_form"),
    }),
});

// --- Simple rate limiter ---
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 3; // max 3 bookings per IP per minute

const requestLog = new Map<string, number[]>();

// Periodically clean up stale entries to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requestLog.entries()) {
        const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
        if (recent.length === 0) {
            requestLog.delete(ip);
        } else {
            requestLog.set(ip, recent);
        }
    }
}, RATE_LIMIT_WINDOW_MS * 5);

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = requestLog.get(ip) ?? [];
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    requestLog.set(ip, recent);

    if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }

    recent.push(now);
    return false;
}

export async function POST(req: Request) {
    try {
        // --- Rate limiting ---
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() || "unknown";

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        // --- Validate request body ---
        const rawBody = await req.json();
        const result = BookingSchema.safeParse(rawBody);

        if (!result.success) {
            return NextResponse.json(
                {
                    error: "Invalid booking data",
                    details: result.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const body = result.data;

        // --- Forward to webhook ---
        const webhookUrl = process.env.APPOINTMENT_WEBHOOK_URL;

        if (!webhookUrl) {
            return NextResponse.json(
                { error: "Webhook URL not configured" },
                { status: 500 }
            );
        }

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `Webhook failed: ${response.status} ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json().catch(() => ({ success: true }));
        return NextResponse.json(data);
    } catch (error) {
        console.error("Booking API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
