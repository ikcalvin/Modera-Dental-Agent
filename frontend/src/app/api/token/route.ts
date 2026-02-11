import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export async function GET() {
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
    });

    at.addGrant({
        roomJoin: true,
        room: "call-" + Math.random().toString(36).substring(7), // Unique room for each call
    });

    const token = await at.toJwt();

    return NextResponse.json({
        accessToken: token,
        url: wsUrl,
    });
}
