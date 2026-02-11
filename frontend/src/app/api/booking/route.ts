import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
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
