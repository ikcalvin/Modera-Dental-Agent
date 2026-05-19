import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

// --- Simple in-memory rate limiter ---
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // max 5 tokens per IP per minute

const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = requestLog.get(ip) ?? [];

    // Prune entries older than the window
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    requestLog.set(ip, recent);

    if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }

    recent.push(now);
    return false;
}

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

export async function GET(req: Request) {
    // --- Rate limiting ---
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 }
        );
    }

    // --- Token generation ---
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
        return NextResponse.json(
            { error: "Server misconfigured" },
            { status: 500 }
        );
    }

    const at = new AccessToken(apiKey, apiSecret, {
        identity: "web-user-" + Math.random().toString(36).substring(7),
        ttl: "5m", // Token expires after 5 minutes
    });

    at.addGrant({
        roomJoin: true,
        room: "call-" + Math.random().toString(36).substring(7),
    });

    const token = await at.toJwt();

    return NextResponse.json({
        accessToken: token,
        url: wsUrl,
    });
}
