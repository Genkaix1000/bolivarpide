"use client";

import React, { useState, useRef, useEffect } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import {
  type Conversation,
  type ChatMessage,
  QUICK_RESPONSES,
} from "@/lib/business/mockChatData";

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

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;
    onSendMessage(clean);
    setInputText("");
  };

  const handleQuickResponse = (text: string) => {
    onSendMessage(text);
  };

  const cleanPhone = conversation.customer.phone.replace(/[^0-9]/g, "");

  return (
    <section
      className={cn(
        "flex flex-col h-full bg-[#f6f2eb] dark:bg-[#12100e] relative overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <header className="px-4 py-3 bg-[#fdfcfb] dark:bg-[#181513] border-b border-[#e8e0d6] dark:border-[#2a2623] flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {onBackMobile && (
            <button
              type="button"
              onClick={onBackMobile}
              className="lg:hidden p-1.5 -ml-1 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              title="Volver a la lista"
            >
              <MaterialSymbol icon="arrow_back" size={20} />
            </button>
          )}

          <div
            className="relative cursor-pointer shrink-0"
            onClick={onOpenContext}
            title="Ver ficha del cliente"
          >
            {conversation.customer.avatarUrl ? (
              <img
                src={conversation.customer.avatarUrl}
                alt={conversation.customer.name}
                className="w-10 h-10 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#e8e0d6] dark:bg-[#2b2521] text-gray-700 dark:text-gray-200 flex items-center justify-center font-bold text-sm">
                {conversation.customer.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#181513]" />
          </div>

          <div className="min-w-0 cursor-pointer" onClick={onOpenContext}>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {conversation.customer.name}
              </h3>
              {conversation.customer.isFavorite && (
                <span title="Cliente frecuente" className="text-amber-500 text-xs">
                  ★
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
              <span>{conversation.customer.phone}</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">WhatsApp conectado</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold bg-[#25d366]/12 hover:bg-[#25d366]/20 text-[#128c7e] dark:text-[#25d366] transition-colors cursor-pointer"
            title="Abrir en WhatsApp Web"
          >
            <MaterialSymbol icon="open_in_new" size={15} />
            <span className="hidden sm:inline">WhatsApp Web</span>
          </a>

          <button
            type="button"
            onClick={onToggleContextPane}
            className={cn(
              "p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer",
              showContextPane && "bg-[#9a0002]/10 text-[#9a0002] dark:text-red-400"
            )}
            title={showContextPane ? "Ocultar panel de comanda" : "Ver comanda y ficha"}
          >
            <MaterialSymbol icon="receipt_long" size={20} />
          </button>
        </div>
      </header>

      {/* Active Order Quick Widget (Sticky below header) */}
      {conversation.activeOrder && conversation.activeOrder.status !== "delivered" && (
        <div className="px-4 py-2.5 bg-white/90 dark:bg-[#181513]/90 backdrop-blur-md border-b border-[#e8e0d6]/70 dark:border-[#2a2623] flex items-center justify-between gap-3 shrink-0 z-10 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#9a0002]/10 text-[#9a0002] dark:text-red-400 font-black text-xs shrink-0">
              #{conversation.activeOrder.orderNumber}
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-gray-900 dark:text-gray-100 truncate">
                Pedido en curso · {conversation.activeOrder.statusLabel}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {conversation.activeOrder.items.length} ítems · Total {formatCents(conversation.activeOrder.totalCents)}
                {conversation.activeOrder.estimatedDelivery && ` · Est: ${conversation.activeOrder.estimatedDelivery}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenContext}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#9a0002] hover:bg-[#7e0002] text-white shrink-0 shadow-xs cursor-pointer transition-colors"
          >
            Ver Comanda
          </button>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {/* Date Divider */}
        <div className="flex items-center justify-center my-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400 shadow-xs">
            Hoy
          </span>
        </div>

        {conversation.messages.map((msg) => {
          // System order event message
          if (msg.type === "system_order_event" && msg.systemEvent) {
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <div className="max-w-md px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-[#1e1a17]/80 backdrop-blur-xs border border-amber-500/20 shadow-xs text-center flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <MaterialSymbol icon="restaurant" size={16} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                      {msg.systemEvent.title}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {msg.systemEvent.description}
                    </p>
                  </div>
                  <span className="text-[9px] text-gray-400 ml-auto shrink-0">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          const isMe = msg.sender === "business";

          return (
            <div
              key={msg.id}
              className={cn("flex items-end gap-2 group", isMe ? "justify-end" : "justify-start")}
            >
              {!isMe && (
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mb-0.5">
                  {conversation.customer.avatarUrl ? (
                    <img
                      src={conversation.customer.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#e8e0d6] flex items-center justify-center text-[10px] font-bold">
                      {conversation.customer.name.slice(0, 1)}
                    </div>
                  )}
                </div>
              )}

              <div
                className={cn(
                  "relative max-w-[82%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs",
                  isMe
                    ? "bg-[#9a0002] text-white rounded-br-xs"
                    : "bg-white dark:bg-[#1e1a17] text-gray-900 dark:text-gray-100 border border-black/5 dark:border-white/5 rounded-bl-xs"
                )}
              >
                {/* Audio message */}
                {msg.type === "audio" && (
                  <div className="flex items-center gap-3 py-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)
                      }
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95",
                        isMe
                          ? "bg-white text-[#9a0002]"
                          : "bg-[#9a0002] text-white"
                      )}
                    >
                      <MaterialSymbol
                        icon={playingAudioId === msg.id ? "pause" : "play_arrow"}
                        size={20}
                        fill
                      />
                    </button>
                    <div className="flex-1 min-w-[120px]">
                      {/* Waveform graphic */}
                      <div className="flex items-center gap-0.5 h-6">
                        {[40, 75, 50, 90, 60, 30, 85, 100, 70, 45, 60, 80, 50, 65, 35].map(
                          (h, idx) => (
                            <span
                              key={idx}
                              style={{ height: `${h}%` }}
                              className={cn(
                                "w-1 rounded-full transition-all",
                                isMe ? "bg-white/70" : "bg-[#9a0002]/60 dark:bg-red-400/60",
                                playingAudioId === msg.id && "animate-pulse"
                              )}
                            />
                          )
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-0.5 opacity-80">
                        <span>Audio de voz</span>
                        <span>{msg.audioDuration ?? "0:15"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Text message */}
                {msg.text && (
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap select-text">
                    {msg.text}
                  </p>
                )}

                {/* Timestamp & Status ticks */}
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 mt-1 text-[10px]",
                    isMe ? "text-white/75" : "text-gray-400"
                  )}
                >
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <MaterialSymbol
                      icon={msg.status === "read" ? "done_all" : "done"}
                      size={13}
                      className={msg.status === "read" ? "text-sky-300" : "text-white/60"}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Responses Chips */}
      <div className="px-3 pt-2 pb-1.5 bg-[#fdfcfb] dark:bg-[#181513] border-t border-[#e8e0d6]/80 dark:border-[#2a2623] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] font-bold text-gray-400 shrink-0 pl-1 flex items-center gap-1">
          <MaterialSymbol icon="bolt" size={14} className="text-amber-500" />
          Rápidas:
        </span>
        {QUICK_RESPONSES.map((qr) => (
          <button
            key={qr.id}
            type="button"
            onClick={() => handleQuickResponse(qr.text)}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap bg-[#f0ebe3] hover:bg-[#9a0002]/10 hover:text-[#9a0002] dark:bg-[#231f1c] dark:hover:bg-[#9a0002]/20 dark:hover:text-red-400 text-gray-700 dark:text-gray-300 border border-black/5 dark:border-white/5 transition-colors shrink-0 cursor-pointer"
          >
            {qr.label}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-[#fdfcfb] dark:bg-[#181513] border-t border-[#e8e0d6] dark:border-[#2a2623] flex items-center gap-2 shrink-0"
      >
        <button
          type="button"
          className="p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          title="Adjuntar foto o comprobante"
        >
          <MaterialSymbol icon="attach_file" size={20} />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribí un mensaje..."
            className="w-full pl-3.5 pr-9 py-2.5 rounded-xl text-[13px] bg-[#f0ebe3] dark:bg-[#221e1b] border border-transparent focus:border-[#9a0002]/40 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none transition-all"
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
            <MaterialSymbol icon="sentiment_satisfied" size={18} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className={cn(
            "p-2.5 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer",
            inputText.trim()
              ? "bg-[#9a0002] hover:bg-[#7e0002] text-white shadow-sm"
              : "bg-gray-200 dark:bg-stone-800 text-gray-400 cursor-not-allowed"
          )}
          title="Enviar mensaje"
        >
          <MaterialSymbol icon="send" size={18} />
        </button>
      </form>
    </section>
  );
}
