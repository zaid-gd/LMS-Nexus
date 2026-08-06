import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, GATE_COOKIE_VALUE } from "@/lib/access-gate";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // The unlock API must always be reachable.
    if (pathname === "/api/gate") {
        return NextResponse.next();
    }

    const isUnlocked =
        request.cookies.get(GATE_COOKIE)?.value === GATE_COOKIE_VALUE;

    // Unlocked visitors pass through normally.
    if (isUnlocked) {
        return NextResponse.next();
    }

    // The gate page itself and any of its assets render without the cookie.
    if (pathname === "/gate" || pathname.startsWith("/_next/")) {
        return NextResponse.next();
    }

    // Everyone else is redirected to the gate, remembering where they came from.
    const gateUrl = new URL("/gate", request.url);
    const destination = pathname + request.nextUrl.search;
    if (destination !== "/") {
        gateUrl.searchParams.set("next", destination);
    }
    return NextResponse.redirect(gateUrl);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
