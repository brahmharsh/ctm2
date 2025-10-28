import { NextResponse } from "next/server";
import { logger } from "../../../shared/logging/logger.js";

export async function GET() {
  const timestamp = new Date().toISOString();
  const response = {
    status: "ok",
    timestamp,
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };

  logger.debug("Health check", {
    uptime: `${Math.floor(response.uptime)}s`,
    memoryMB: response.memory.heapUsed,
  });

  return NextResponse.json(response);
}

