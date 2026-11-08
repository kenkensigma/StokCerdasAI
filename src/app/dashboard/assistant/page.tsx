"use client";

import * as React from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoleRestrictedCard } from "@/components/auth/role-restricted-card";
import { useAuthSession } from "@/hooks/use-auth-session";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

function generateMessageId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

function getFormattedTime(): string {
  try {
    return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  } catch {
    return "Baru saja";
  }
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome-1",
  role: "assistant",
  content:
    "Halo! Saya **Asisten Bisnis StokCerdas AI** yang terhubung langsung dengan database toko Anda.\n\nAnda dapat mengajukan pertanyaan spesifik terkait persediaan, produk yang perlu direstock, titik pemesanan ulang (ROP), atau riwayat penjualan. Silakan pilih salah satu pertanyaan cepat di bawah atau ketik pertanyaan Anda sendiri.",
  timestamp: "Aktif",
};

const QUICK_PROMPTS = [
  "Produk apa yang harus direstock hari ini?",
  "Produk mana yang paling banyak terjual?",
  "Mengapa ada produk yang masuk kategori kritis?",
  "Bagaimana ringkasan omzet penjualan toko saya?",
  "Barang mana yang laju penjualannya paling lambat?",
];

export default function AssistantPage() {
  const { isOwner, isLoading: isAuthLoading } = useAuthSession();
  const [messages, setMessages] = React.useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: generateMessageId("user"),
      role: "user",
      content: text,
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal mendapatkan respon dari Asisten AI");
      }

      const json = await res.json();
      const replyContent = json.data?.reply || "Maaf, tidak ada respon yang diterima.";

      const assistantMsg: ChatMessage = {
        id: generateMessageId("assistant"),
        role: "assistant",
        content: replyContent,
        timestamp: getFormattedTime(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: generateMessageId("err"),
        role: "assistant",
        content: "⚠️ Maaf, terjadi kendala saat menghubungi asisten AI. Silakan coba kembali dalam beberapa saat.",
        timestamp: getFormattedTime(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderFormattedContent = (content: string) => {
    // Render simple markdown: bold (**text**) and newlines
    const lines = content.split("\n");
    return lines.map((line, lineIdx) => {
      if (!line.trim()) {
        return <div key={lineIdx} className="h-2" />;
      }

      // Check if bullet point
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("• ");
      const rawText = isBullet ? line.trim().substring(2) : line;

      // Parse bold segments
      const parts = rawText.split(/(\*\*.*?\*\*)/g);

      return (
        <div key={lineIdx} className={isBullet ? "flex items-start gap-1.5 ml-2 my-0.5" : "my-0.5"}>
          {isBullet && <span className="text-slate-400 mt-1 select-none">•</span>}
          <span>
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className="font-semibold text-slate-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </span>
        </div>
      );
    });
  };

  if (!isAuthLoading && !isOwner) {
    return (
      <RoleRestrictedCard
        title="Asisten Bisnis AI — Khusus Pemilik Toko"
        description="Fitur konsultasi cerdas dan analisis performa toko langsung dari basis data hanya dapat diakses oleh Pemilik Toko (OWNER). Akun Anda terdaftar sebagai Staf Toko (STAFF)."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Asisten Pertanyaan Bisnis AI
            </h1>
            <Badge variant="default" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              StokCerdas AI
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ajukan pertanyaan bebas seputar kondisi inventaris, rekomendasi restock, atau evaluasi penjualan toko Anda.
          </p>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setMessages([
                {
                  id: generateMessageId("welcome"),
                  role: "assistant",
                  content:
                    "Sesi obrolan baru dimulai. Silakan ajukan pertanyaan atau pilih topik di bawah.",
                  timestamp: getFormattedTime(),
                },
              ])
            }
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Percakapan Baru
          </Button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card className="border border-slate-200 shadow-sm flex flex-col h-[650px]">
        {/* Messages Feed */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white shadow-xs rounded-tr-none"
                    : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none"
                }`}
              >
                <div>{renderFormattedContent(msg.content)}</div>
                <div
                  className={`mt-1.5 text-[10px] text-right ${
                    msg.role === "user" ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-700 border border-blue-200">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs sm:text-sm rounded-tl-none flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 animate-spin" />
                <span>Asisten sedang menganalisis data riil inventaris toko Anda...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Strip */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 overflow-x-auto flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-blue-600" />
            Pertanyaan cepat:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs whitespace-nowrap transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <Input
            placeholder="Ketik pertanyaan bisnis seputar stok atau penjualan Anda di sini..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm h-11"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white shrink-0 flex items-center gap-1.5"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Kirim</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
