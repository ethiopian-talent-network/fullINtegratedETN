import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Send, MessageSquare, Loader2,
  CheckCheck, Check, Smile, X,
} from "lucide-react";
import type { Conversation, RealMessage } from "../../../api/talent/talentApi";

interface Props {
  activeConv: Conversation | null;
  messages: RealMessage[];
  currentUserId: number;
  userImage?: string;
  loadingMsgs: boolean;
  sending: boolean;
  onSend: (text: string) => void;
  onBack: () => void;
  showSidebar: boolean;
  darkMode: boolean;
}

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const formatMsgTime = (d: string) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

const EMOJIS = ["😀", "😊", "😍", "🤔", "😢", "😂", "👍", "👎", "❤️", "🎉", "🔥", "💯"];

export function ChatArea({ activeConv, messages, currentUserId, userImage, loadingMsgs, sending, onSend, onBack, showSidebar, darkMode: dm }: Props) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeConv) {
      setText("");
      inputRef.current?.focus();
    }
  }, [activeConv?.user_id]);

  const handleSend = () => {
    if (!text.trim() || sending) return;
    onSend(text.trim());
    setText("");
    setShowEmoji(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const grouped = messages.reduce<{ date: string; msgs: RealMessage[] }[]>((acc, msg) => {
    const date = formatDate(msg.created_at);
    const last = acc[acc.length - 1];
    if (last?.date === date) last.msgs.push(msg);
    else acc.push({ date, msgs: [msg] });
    return acc;
  }, []);

  const chatBg = dm ? "bg-gray-950" : "bg-slate-50";
  const headerBg = dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-100 shadow-sm";
  const inputAreaBg = dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-100";
  const inputBg = dm ? "bg-gray-800 border-gray-700" : "bg-slate-50 border-slate-200";
  const muted = dm ? "text-gray-500" : "text-gray-400";

  if (!activeConv) {
    return (
      <div className={`${!showSidebar ? "flex" : "hidden"} sm:flex flex-col flex-1 items-center justify-center ${chatBg}`}>
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 ${dm ? "bg-gray-800" : "bg-slate-100"}`}>
          <MessageSquare className={`w-9 h-9 ${muted} opacity-50`} />
        </div>
        <p className={`text-lg font-bold mb-1.5 ${dm ? "text-white" : "text-gray-800"}`}>Your Messages</p>
        <p className={`text-sm ${muted}`}>Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className={`${!showSidebar ? "flex" : "hidden"} sm:flex flex-col flex-1 overflow-hidden ${chatBg}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3.5 border-b flex-shrink-0 ${headerBg}`}>
        <button
          onClick={onBack}
          className={`sm:hidden p-1.5 rounded-lg mr-0.5 transition-colors ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-100 text-gray-500"}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {activeConv.profile_image ? (
          <img src={activeConv.profile_image} alt={activeConv.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0084ca] to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials(activeConv.name)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${dm ? "text-white" : "text-gray-900"}`}>{activeConv.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <p className={`text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>Active now</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {loadingMsgs ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-[#0084ca]" />
          </div>
        ) : messages.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-full gap-2 ${muted}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${dm ? "bg-gray-800" : "bg-slate-100"}`}>
              <MessageSquare className="w-8 h-8 opacity-30" />
            </div>
            <p className={`text-sm font-semibold ${dm ? "text-gray-300" : "text-gray-600"}`}>No messages yet</p>
            <p className="text-xs">Say hello to {activeConv.name}!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {grouped.map(({ date, msgs }) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className={`flex-1 h-px ${dm ? "bg-gray-800" : "bg-slate-200"}`} />
                  <span className={`text-[11px] font-medium px-3 py-1 rounded-full ${dm ? "bg-gray-800 text-gray-500" : "bg-slate-200 text-gray-500"}`}>
                    {date}
                  </span>
                  <div className={`flex-1 h-px ${dm ? "bg-gray-800" : "bg-slate-200"}`} />
                </div>

                <div className="space-y-1.5">
                  {msgs.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUserId;
                    const showAvatar = !isMe && (idx === 0 || msgs[idx - 1]?.sender_id !== msg.sender_id);

                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                        {/* Other avatar */}
                        {!isMe && (
                          <div className="w-7 h-7 flex-shrink-0">
                            {showAvatar ? (
                              activeConv.profile_image ? (
                                <img src={activeConv.profile_image} alt="" className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0084ca] to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
                                  {initials(activeConv.name)}
                                </div>
                              )
                            ) : null}
                          </div>
                        )}

                        <div className={`max-w-[68%] sm:max-w-[55%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? "bg-[#0084ca] text-white rounded-br-sm shadow-sm shadow-[#0084ca]/20"
                              : dm
                              ? "bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700"
                              : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-slate-200"
                          }`}>
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                            <span className={`text-[10px] ${dm ? "text-gray-600" : "text-gray-400"}`}>
                              {formatMsgTime(msg.created_at)}
                            </span>
                            {isMe && (
                              msg.is_read
                                ? <CheckCheck className="w-3 h-3 text-[#0084ca]" />
                                : <Check className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className={`px-4 py-3 border-t flex-shrink-0 ${inputAreaBg}`}>
        {/* Emoji picker */}
        {showEmoji && (
          <div className={`mb-2 p-2.5 rounded-xl border flex flex-wrap gap-1 ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200 shadow-md"}`}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => { setText((t) => t + e); inputRef.current?.focus(); }}
                className="text-lg p-1 rounded hover:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
            <button
              onClick={() => setShowEmoji(false)}
              className={`ml-auto p-1 rounded-lg ${dm ? "hover:bg-gray-700 text-gray-500" : "hover:bg-slate-100 text-gray-400"}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowEmoji((v) => !v)}
            className={`p-2 rounded-xl transition-colors flex-shrink-0 mb-0.5 ${showEmoji ? "bg-[#0084ca]/10 text-[#0084ca]" : dm ? "hover:bg-gray-800 text-gray-500" : "hover:bg-slate-100 text-gray-400"}`}
          >
            <Smile className="w-5 h-5" />
          </button>

          <div className={`flex-1 flex items-end rounded-2xl border px-4 py-2.5 ${inputBg}`}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message ${activeConv.name}...`}
              rows={1}
              className={`flex-1 bg-transparent outline-none text-sm resize-none max-h-28 ${dm ? "text-white placeholder-gray-600" : "text-gray-900 placeholder-gray-400"}`}
              style={{ minHeight: "22px" }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 flex items-center justify-center bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm shadow-[#0084ca]/30"
          >
            {sending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
          </button>
        </div>

        <p className={`text-[10px] text-center mt-1.5 ${dm ? "text-gray-700" : "text-gray-300"}`}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
