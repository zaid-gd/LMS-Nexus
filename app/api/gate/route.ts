import { NextResponse } from "next/server";
import {
    GATE_COOKIE,
    GATE_COOKIE_MAX_AGE,
    GATE_COOKIE_VALUE,
    isGatePasswordValid,
} from "@/lib/access-gate";

export async function POST(request: Request) {
    let password = "";
    try {
        const body = await request.json();
        if (typeof body?.password === "string") {
            password = body.password;
        }
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    if (!isGatePasswordValid(password)) {
        return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(GATE_COOKIE, GATE_COOKIE_VALUE, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: GATE_COOKIE_MAX_AGE,
    });
    return response;
}
