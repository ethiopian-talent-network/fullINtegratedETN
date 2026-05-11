import { useState, useEffect, useRef, useCallback } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { useAuth } from "../../contexts/AuthContext";
import { Header } from "../talents/components/Header";
import {
  getConversations,
  getRealMessages,
  sendRealMessage,
  markConversationRead,
  getTalentProfile,
  getMyConnections,
  type Conversation,
  type RealMessage,
  type Connection,
} from "../../api/talent/talentApi";
import { ConversationList } from "./components/ConversationList";
import { ChatArea } from "./components/ChatArea";
import { NewConversationPanel } from "./components/NewConversationPanel";

export default function MessagingPage() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { user } = useAuth();

  const [userImage, setUserImage] = useState<string | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [messages, setMessages] = useState<RealMessage[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getTalentProfile()
      .then((p) => { if (p.data.profile_image) setUserImage(p.data.profile_image); })
      .catch(() => {});
    loadConversations();
    loadConnections();
  }, []);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeConv) {
      pollRef.current = setInterval(() => {
        loadMessages(activeConv.user_id, true);
        loadConversations(true);
      }, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConv]);

  const loadConversations = async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const res = await getConversations();
      setConversations(res.conversations || []);
    } catch {}
    finally { setLoadingConvs(false); }
  };

  const loadConnections = async () => {
    try {
      const res = await getMyConnections();
      setConnections(res.connections || []);
    } catch {}
  };

  const loadMessages = async (userId: number, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const res = await getRealMessages(userId);
      setMessages(res.messages || []);
      setConversations((prev) =>
        prev.map((c) => c.user_id === userId ? { ...c, unread_count: 0 } : c)
      );
    } catch {}
    finally { setLoadingMsgs(false); }
  };

  const selectConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv);
    setShowSidebar(false);
    setShowNewMsg(false);
    await loadMessages(conv.user_id);
    await markConversationRead(conv.user_id).catch(() => {});
  }, []);

  const startConversation = useCallback(async (conn: Connection) => {
    setShowNewMsg(false);
    const conv: Conversation = {
      user_id: conn.user_id ?? conn.talent_id ?? conn.sender_id ?? 0,
      name: conn.name,
      profile_image: conn.profile_image,
      last_message: "",
      last_message_at: new Date().toISOString(),
      unread_count: 0,
    };
    setActiveConv(conv);
    setShowSidebar(false);
    await loadMessages(conv.user_id);
  }, []);

  const handleSend = async (content: string) => {
    if (!content.trim() || !activeConv || sending) return;
    const optimistic: RealMessage = {
      id: Date.now(),
      sender_id: user?.id ?? 0,
      reciver_id: activeConv.user_id,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: user?.name ?? "",
      sender_image: userImage,
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    try {
      await sendRealMessage(activeConv.user_id, content);
      await loadMessages(activeConv.user_id, true);
      await loadConversations(true);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.last_message?.toLowerCase().includes(search.toLowerCase())
  );

  const dm = darkMode;

  return (
    <div className={`flex flex-col h-screen ${dm ? "bg-gray-950" : "bg-slate-100"} transition-colors duration-300`}>
      <Header darkMode={dm} toggleDarkMode={toggleDarkMode} userImage={userImage} onImageUpload={() => {}} />

      <div className="flex flex-1 overflow-hidden max-w-7xl w-full mx-auto sm:px-4 lg:px-6 sm:py-4">
        <div className={`flex w-full h-full sm:rounded-2xl overflow-hidden border shadow-xl ${dm ? "border-gray-800 bg-gray-900" : "border-slate-200 bg-white"}`}>

          {/* Sidebar */}
          <div className={`${showSidebar ? "flex" : "hidden"} sm:flex flex-col w-full sm:w-80 lg:w-96 flex-shrink-0 border-r ${dm ? "border-gray-800" : "border-slate-100"}`}>
            <ConversationList
              conversations={filtered}
              activeUserId={activeConv?.user_id ?? null}
              search={search}
              onSearchChange={setSearch}
              onSelect={selectConversation}
              onNewMessage={() => setShowNewMsg((v) => !v)}
              onRefresh={() => loadConversations()}
              loading={loadingConvs}
              darkMode={dm}
            />
            {showNewMsg && (
              <NewConversationPanel
                connections={connections}
                onSelect={startConversation}
                onClose={() => setShowNewMsg(false)}
                darkMode={dm}
              />
            )}
          </div>

          {/* Chat area */}
          <ChatArea
            activeConv={activeConv}
            messages={messages}
            currentUserId={user?.id ?? 0}
            userImage={userImage}
            loadingMsgs={loadingMsgs}
            sending={sending}
            onSend={handleSend}
            onBack={() => setShowSidebar(true)}
            showSidebar={showSidebar}
            darkMode={dm}
          />
        </div>
      </div>
    </div>
  );
}
