import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET() {
    const testError = new Error(`[TEST ${Date.now()}] Sentry → Slack Test 🚀`);
    Sentry.captureException(testError);
    return NextResponse.json({
        message: "Error sent to Sentry!",
        timestamp: new Date().toISOString()
    });
}