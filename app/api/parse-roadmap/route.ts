import type { NextRequest } from "next/server";
import { handleRoadmapIntake } from "@/lib/server/roadmap-intake";

export async function POST(request: NextRequest) {
    return handleRoadmapIntake(request);
}
