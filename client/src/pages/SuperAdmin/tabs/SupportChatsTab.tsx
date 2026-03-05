import { useState, useEffect, useRef, useCallback } from "react";
import { ChatBubbleLeftRightIcon, ArrowPathIcon, XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { getCableConsumer } from "../../../services/cable";
import type { Subscription } from "@rails/actioncable";
import StatusBadge from "../components/StatusBadge";
import OnlineBadge from "../../../components/OnlineBadge";
import { fetchSupportChats, fetchSupportChat, replySupportChat, assignSupportChat, closeSupportChat, fetchEmployees } from "../../../services/adminApi";
import { toast } from "react-hot-toast";

interface Chat {
    id: string;
    chatable_type: string;
    chatable_name: string;
    status: string;
    assigned_to: string | null;
    assigned_to_id: string | null;
    updated_at: string;
}

interface Message {
    id: string;
    body: string;
    sender_type: string;
    sender_name: string | null;
    sender_online?: boolean;
    created_at: string;
}

export default function SupportChatsTab() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
    const [showAssign, setShowAssign] = useState(false);
    const messagesEnd = useRef<HTMLDivElement>(null);

    const loadChats = useCallback(async () => {
        try {
            const res = await fetchSupportChats();
            setChats(res.data.chats || []);
        } catch { toast.error("Failed to load support chats"); }
        setLoading(false);
    }, []);

    useEffect(() => { loadChats(); }, [loadChats]);

    const openChat = async (chat: Chat) => {
        setSelectedChat(chat);
        try {
            const res = await fetchSupportChat(chat.id);
            setMessages(res.data.messages || []);
        } catch { toast.error("Failed to load messages"); }
    };

    useEffect(() => {
        let sub: Subscription | null = null;
        if (selectedChat) {
            const consumer = getCableConsumer();
            sub = consumer.subscriptions.create(
                { channel: "ChatChannel", chat_id: selectedChat.id },
                {
                    received: (data: any) => {
                        if (data.action === 'message_created') {
                            setMessages(prev => {
                                if (prev.find(m => m.id === data.message.id)) return prev;
                                return [...prev, data.message];
                            });
                        }
                    },
                    connected() { console.log("[Admin ChatChannel] Connected"); }
                }
            );
        }
        return () => { if (sub) sub.unsubscribe(); };
    }, [selectedChat]);

    useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleReply = async () => {
        if (!reply.trim() || !selectedChat) return;
        setSending(true);
        try {
            await replySupportChat(selectedChat.id, reply);
            setReply("");
            const res = await fetchSupportChat(selectedChat.id);
            setMessages(res.data.messages || []);
            loadChats();
        } catch { toast.error("Failed to send reply"); }
        setSending(false);
    };

    const handleAssign = async (employeeId: string) => {
        if (!selectedChat) return;
        try {
            await assignSupportChat(selectedChat.id, employeeId);
            setShowAssign(false);
            loadChats();
            toast.success("Chat assigned");
        } catch { toast.error("Failed to assign"); }
    };

    const handleClose = async () => {
        if (!selectedChat) return;
        try {
            await closeSupportChat(selectedChat.id);
            setSelectedChat(null);
            setMessages([]);
            loadChats();
            toast.success("Chat closed");
        } catch { toast.error("Failed to close"); }
    };

    const loadEmployees = async () => {
        try {
            const res = await fetchEmployees();
            setEmployees((res.data.employees || []).map((e: any) => ({ id: String(e.id), full_name: String(e.full_name || e.email) })));
        } catch { /* */ }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Support Chats</h2>
                    <p className="text-muted-foreground text-sm mt-1">Real-time support for authenticated users</p>
                </div>
                <button onClick={() => { setLoading(true); loadChats(); }} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                    <ArrowPathIcon className="h-4 w-4" /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 500 }}>
                {/* Chat List */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-3 border-b border-border">
                        <p className="text-sm font-medium text-muted-foreground">{chats.length} active chat{chats.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="overflow-y-auto max-h-[450px]">
                        {loading ? (
                            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" /></div>
                        ) : chats.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-12">No active support chats</p>
                        ) : (
                            chats.map((c) => (
                                <button key={c.id} onClick={() => openChat(c)} className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${selectedChat?.id === c.id ? "bg-muted" : ""}`}>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-sm font-medium text-foreground truncate">{c.chatable_name}</span>
                                        <StatusBadge status={c.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{c.chatable_type}</p>
                                    <p className="text-[10px] text-gray-600 mt-1">{new Date(c.updated_at).toLocaleString()}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Detail / Messages */}
                <div className="lg:col-span-2 bg-card rounded-xl border border-border flex flex-col overflow-hidden">
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{selectedChat.chatable_name} <span className="text-muted-foreground font-normal text-xs">({selectedChat.chatable_type})</span></p>
                                    <p className="text-xs text-muted-foreground">{selectedChat.assigned_to ? `Assigned to ${selectedChat.assigned_to}` : "Unassigned"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { loadEmployees(); setShowAssign(!showAssign); }} className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-xs text-muted-foreground rounded-lg">Assign</button>
                                    {selectedChat.status !== "closed" && (
                                        <button onClick={handleClose} className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-xs text-red-400 rounded-lg">Close</button>
                                    )}
                                    <button onClick={() => { setSelectedChat(null); setMessages([]); }}><XMarkIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
                                </div>
                            </div>

                            {/* Assign Dropdown */}
                            {showAssign && (
                                <div className="px-4 py-2 border-b border-border bg-muted">
                                    <p className="text-xs text-muted-foreground mb-2">Assign to:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {employees.map((e) => (
                                            <button key={e.id} onClick={() => handleAssign(e.id)} className="px-2.5 py-1 bg-muted hover:bg-primary text-xs text-muted-foreground rounded-lg transition-colors">{e.full_name}</button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.sender_type === "Employee" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.sender_type === "Employee" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                                            {m.sender_type === "Employee" && m.sender_name && (
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <p className="text-[10px] text-primary-foreground/80 font-bold">{m.sender_name}</p>
                                                    <OnlineBadge online={!!m.sender_online} />
                                                </div>
                                            )}
                                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                            <p className={`text-[10px] mt-1 ${m.sender_type === "Employee" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEnd} />
                            </div>

                            {/* Reply Input */}
                            {selectedChat.status !== "closed" && (
                                <div className="px-4 py-3 border-t border-border flex items-center gap-2 flex-shrink-0">
                                    <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                                        placeholder="Type a reply…" className="flex-1 px-3 py-2 bg-muted border border-border rounded-full text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-primary" />
                                    <button onClick={handleReply} disabled={sending || !reply.trim()} className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground disabled:opacity-50 flex-shrink-0">
                                        <PaperAirplaneIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center p-6">
                            <ChatBubbleLeftRightIcon className="h-12 w-12 mb-3 opacity-50 text-primary" />
                            <h3 className="text-lg font-medium text-foreground">Support Center</h3>
                            <p className="text-sm max-w-xs">Select a conversation from the left to start chatting with verified users.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
