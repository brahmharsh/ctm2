import { NextResponse } from "next/server";
import { logger } from "@/shared/logging/logger.js";

// Simple in-memory counter (process-local). For production, move to Redis or DB.
let counterValue = 0;

export async function GET() {
  logger.debug("Counter GET", { value: counterValue });
  return NextResponse.json({ success: true, data: { value: counterValue } });
}

export async function POST() {
  counterValue += 1;
  logger.info("Counter increment", { value: counterValue });
  return NextResponse.json({ success: true, data: { value: counterValue } });
}

export async function DELETE() {
  counterValue = 0;
  logger.warn("Counter reset (DELETE)", {});
  return NextResponse.json({ success: true, data: { value: counterValue } });
}
