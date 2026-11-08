import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";

export async function GET() {
  return NextResponse.json({
    data: {
      status: "ok",
      service: siteConfig.name,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    },
    message: "Service operational",
  });
}

