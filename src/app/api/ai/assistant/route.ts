import { NextResponse, type NextRequest } from "next/server";
import { requireStoreMember } from "@/lib/auth/session";
import { askBusinessAssistant, type AssistantMessage } from "@/services/ai-assistant.service";

export async function POST(request: NextRequest) {
  try {
    const member = await requireStoreMember("use_ai_assistant");

    const body = await request.json();
    const message = body?.message;
    const history = (body?.history || []) as AssistantMessage[];

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Pesan pertanyaan tidak boleh kosong." } },
        { status: 400 }
      );
    }

    const reply = await askBusinessAssistant(member.storeId, message.trim(), history);

    return NextResponse.json({
      data: {
        reply,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memproses pertanyaan asisten AI";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: { code: "ASSISTANT_ERROR", message } }, { status });
  }
}

