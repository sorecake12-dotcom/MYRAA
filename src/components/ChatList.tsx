import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface ChatListProps {
  messages: ChatMessage[];
  userName: string;
  assistantName: string;
}

export const ChatList: React.FC<ChatListProps> = ({ messages, assistantName }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const displayAssistantName = assistantName || 'MYRA';

  return (
    <div
      ref={scrollRef}
      className="w-full flex-1 overflow-y-auto px-4 py-3 space-y-3.5 custom-scrollbar"
      id="chat-list-container"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center text-[#555555] p-6 space-y-2">
          <div className="w-10 h-10 rounded-full border border-[#FF1744]/30 bg-[#FF1744]/10 flex items-center justify-center text-[#FF1744]">
            💬
          </div>
          <p className="text-sm font-medium">Tap mic & speak to talk to {displayAssistantName}</p>
          <p className="text-xs font-mono text-[#444444]">
            "YouTube kholo" • "torch on karo" • "volume badhao" • "bluetooth off"
          </p>
        </div>
      ) : (
        messages.map((msg) => {
          const timeFormatted = new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.isUser ? 'items-end' : 'items-start'
              }`}
              id={`chat-msg-${msg.id}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all ${
                  msg.isUser
                    ? 'bg-[#1A0000] border border-[#FF1744]/60 text-[#EEEEEE] rounded-br-none'
                    : 'bg-[#111111] border border-[#222222] text-[#EEEEEE] rounded-bl-none'
                }`}
              >
                {!msg.isUser && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#FF1744]" />
                    <span className="text-[11px] font-bold text-[#FF1744] tracking-wider uppercase">
                      {displayAssistantName}
                    </span>
                  </div>
                )}

                <p className="whitespace-pre-wrap leading-relaxed text-[13.5px]">
                  {msg.text}
                </p>

                {msg.commandExecuted && (
                  <div className="mt-1.5 pt-1.5 border-t border-[#222222] flex items-center gap-1.5 text-[11px] font-mono text-[#00E676]">
                    <CheckCircle2 className="w-3 h-3 text-[#00E676]" />
                    <span>{msg.commandExecuted}</span>
                  </div>
                )}

                <div className="mt-1 text-[10px] font-mono text-[#666666] text-right">
                  {timeFormatted}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
