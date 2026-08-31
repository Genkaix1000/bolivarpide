"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { type Conversation, QUICK_RESPONSES } from "@/lib/business/mockChatData";

interface ChatConversationPaneProps {
  conversation: Conversation;
  onSendMessage: (text: string) => void;
  onOpenContext: () => void;
  onBackMobile?: () => void;
  showContextPane: boolean;
  onToggleContextPane: () => void;
  className?: string;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("es-AR")}`;
}

export function ChatConversationPane({
  conversation,
  onSendMessage,
  onOpenContext,
  onBackMobile,
  showContextPane,
  onToggleContextPane,
  className,
}: ChatConversationPaneProps) {
  const [inputText, setInputText] = useState("");
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;
    onSendMessage(clean);
    setInputText("");
  }

  const cleanPhone = conversation.customer.phone.replace(/[^0-9]/g, "");
  const liveOrder =
    conversation.activeOrder &&
    conversation.activeOrder.status !== "delivered" &&
    conversation.activeOrder.status !== "cancelled"
      ? conversation.activeOrder
      : null;

  return (
    <section
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f2eb] dark:bg-[#12100e]",
        className,
      )}
    >
      <header className="z-10 flex shrink-0 items-center justify-between gap-3 border-b border-[#e8e0d6] bg-[#fdfcfb] px-3 py-2.5 dark:border-[#2a2623] dark:bg-[#181513]">
        <div className="flex min-w-0 items-center gap-2.5">
          {onBackMobile ? (
            <button
              type="button"
              onClick={onBackMobile}
              className="rounded-xl p-1.5 text-gray-600 hover:bg-black/5 lg:hidden dark:text-gray-300"
              aria-label="Volver"
            >
              <MaterialSymbol icon="arrow_back" size={20} />
            </button>
          ) : null}

          <button type="button" onClick={onOpenContext} className="relative shrink-0 cursor-pointer">
            {conversation.customer.avatarUrl ? (
              <img
                src={conversation.customer.avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e0d6] text-sm font-bold text-gray-700 dark:bg-[#2b2521] dark:text-gray-200">
                {conversation.customer.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#fdfcfb] dark:ring-[#181513]" />
          </button>

          <button type="button" onClick={onOpenContext} className="min-w-0 cursor-pointer text-left">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
              {conversation.customer.name}
              {conversation.customer.isFavorite ? <span className="ml-1 text-amber-500">★</span> : null}
            </p>
            <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
              {conversation.customer.phone}
            </p>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl p-2 text-[#128c7e] hover:bg-[#25d366]/12"
            title="Abrir en WhatsApp"
          >
            <MaterialSymbol icon="open_in_new" size={18} />
          </a>
          <button
            type="button"
            onClick={onToggleContextPane}
            className={cn(
              "rounded-xl p-2 text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300",
              showContextPane && "bg-[#9a0002]/10 text-[#9a0002] dark:text-red-400",
            )}
            title={showContextPane ? "Ocultar detalles" : "Ver detalles"}
          >
            <MaterialSymbol icon="info" size={20} />
          </button>
        </div>
      </header>

      {liveOrder ? (
        <button
          type="button"
          onClick={onOpenContext}
          className="z-10 flex shrink-0 items-center justify-between gap-2 border-b border-[#e8e0d6]/80 bg-white/95 px-3 py-2 text-left backdrop-blur dark:border-[#2a2623] dark:bg-[#181513]/95"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="rounded-md bg-[#9a0002] px-1.5 py-0.5 text-[10px] font-black text-white">
              #{liveOrder.orderNumber}
            </span>
            <span className="truncate text-[12px] font-semibold text-gray-900 dark:text-gray-100">
              {liveOrder.statusLabel}
              <span className="font-normal text-gray-500">
                {" "}
                · {liveOrder.items.length} ítems · {formatCents(liveOrder.totalCents)}
              </span>
            </span>
          </span>
          <MaterialSymbol icon="chevron_right" size={18} className="shrink-0 text-gray-400" />
        </button>
      ) : null}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="flex justify-center">
          <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:bg-white/10 dark:text-gray-400">
            Hoy
          </span>
        </div>

        {conversation.messages.map((msg) => {
          if (msg.type === "system_order_event" && msg.systemEvent) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="max-w-sm rounded-2xl border border-amber-500/20 bg-white/90 px-3 py-2 text-center text-[11px] shadow-xs dark:bg-[#1e1a17]/90">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{msg.systemEvent.title}</p>
                  <p className="text-gray-500">{msg.systemEvent.description}</p>
                </div>
              </div>
            );
          }

          const isMe = msg.sender === "business";
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3 py-2 shadow-xs",
                  isMe
                    ? "rounded-br-sm bg-[#9a0002] text-white"
                    : "rounded-bl-sm border border-black/5 bg-white text-gray-900 dark:border-white/5 dark:bg-[#1e1a17] dark:text-gray-100",
                )}
              >
                {msg.type === "audio" ? (
                  <div className="flex items-center gap-2 py-0.5">
                    <button
                      type="button"
                      onClick={() => setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        isMe ? "bg-white text-[#9a0002]" : "bg-[#9a0002] text-white",
                      )}
                    >
                      <MaterialSymbol
                        icon={playingAudioId === msg.id ? "pause" : "play_arrow"}
                        size={18}
                        fill
                      />
                    </button>
                    <span className="text-[11px] opacity-80">{msg.audioDuration ?? "0:15"}</span>
                  </div>
                ) : null}
                {msg.text ? (
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.text}</p>
                ) : null}
                <div
                  className={cn(
                    "mt-1 flex items-center justify-end gap-1 text-[10px]",
                    isMe ? "text-white/75" : "text-gray-400",
                  )}
                >
                  <span>{msg.timestamp}</span>
                  {isMe ? (
                    <MaterialSymbol
                      icon={msg.status === "read" ? "done_all" : "done"}
                      size={13}
                      className={msg.status === "read" ? "text-sky-300" : undefined}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-t border-[#e8e0d6]/80 bg-[#fdfcfb] px-3 py-1.5 dark:border-[#2a2623] dark:bg-[#181513]">
        {QUICK_RESPONSES.map((qr) => (
          <button
            key={qr.id}
            type="button"
            onClick={() => onSendMessage(qr.text)}
            className="shrink-0 rounded-full bg-[#f0ebe3] px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-[#9a0002]/10 hover:text-[#9a0002] dark:bg-[#231f1c] dark:text-gray-300"
          >
            {qr.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSend}
        className="flex shrink-0 items-center gap-2 border-t border-[#e8e0d6] bg-[#fdfcfb] p-3 dark:border-[#2a2623] dark:bg-[#181513]"
      >
        <button type="button" className="rounded-xl p-2 text-gray-500 hover:bg-black/5" title="Adjuntar">
          <MaterialSymbol icon="attach_file" size={20} />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribí un mensaje…"
          className="min-w-0 flex-1 rounded-full border border-transparent bg-[#f0ebe3] px-3.5 py-2.5 text-[13px] outline-none focus:border-[#9a0002]/35 dark:bg-[#221e1b] dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className={cn(
            "rounded-full p-2.5",
            inputText.trim()
              ? "bg-[#9a0002] text-white hover:bg-[#7e0002]"
              : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-stone-800",
          )}
        >
          <MaterialSymbol icon="send" size={18} />
        </button>
      </form>
    </section>
  );
}
