import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChatBubbleLeftRightIcon, ArrowPathIcon, XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { getCableConsumer } from "../../../services/cable";
import type { Subscription } from "@rails/actioncable";
import StatusBadge from "../components/StatusBadge";
import OnlineBadge from "../../../components/OnlineBadge";
import {
    useGuestChats,
    useGuestChatDetail,
    useChatEmployees,
    useReplyGuestChat,
    useAssignGuestChat,
    useCloseGuestChat,
} from "../queries/guestChats.queries";
import { adminQueryKeys } from "../queries/queryKeys";

interface Chat {
    id: string;
    guest_name: string;
    guest_email: string;
    subject: string;
    status: string;
    assigned_to: string | null;
    assigned_to_id: string | null;
    created_at: string;
    updated_at: string;
    message_count: number;
    last_message: string | null;
}

interface Message {
    id: string;
    body: string;
    sender_type: "guest" | "employee";
    sender_name: string | null;
    sender_online?: boolean;
    created_at: string;
}

export default function GuestChatsTab() {
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [reply, setReply] = useState("");
    const [showAssign, setShowAssign] = useState(false);
    const messagesEnd = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const { data: chatsData, isLoading, refetch } = useGuestChats({ statusFilter });
    const { data: chatDetail, isLoading: messagesLoading } = useGuestChatDetail(selectedChatId);
    const { data: employeesData } = useChatEmployees();

    const chats: Chat[] = chatsData?.chats || [];
    const stats = chatsData?.stats || { total: 0, open: 0, assigned: 0, closed: 0 };
    const messages: Message[] = chatDetail?.messages || [];
    const employees: { id: string; full_name: string }[] = (employeesData?.employees || []).map((e: Record<string, unknown>) => ({
        id: String(e.id),
        full_name: String(e.full_name || e.email),
    }));

    const replyChat = useReplyGuestChat();
    const assignChat = useAssignGuestChat();
    const closeChat = useCloseGuestChat();

    // WebSocket subscription — appends messages directly to the query cache
    useEffect(() => {
        if (!selectedChatId) return;
        let sub: Subscription | null = null;
        const consumer = getCableConsumer();
        sub = consumer.subscriptions.create(
            { channel: "ChatChannel", chat_id: selectedChatId, chat_type: "GuestChat" },
            {
                received: (data: { action: string; message: Message }) => {
                    if (data.action === "message_created") {
                        queryClient.setQueryData(
                            adminQueryKeys.guestChats.detail(selectedChatId),
                            (old: { messages?: Message[] } | undefined) => {
                                if (!old) return old;
                                const msgs = old.messages || [];
                                if (msgs.find((m) => m.id === data.message.id)) return old;
                                return { ...old, messages: [...msgs, data.message] };
                            }
                        );
                    }
                },
                connected() { console.log("[Admin Guest ChatChannel] Connected"); },
            }
        );
        return () => { if (sub) sub.unsubscribe(); };
    }, [selectedChatId, queryClient]);

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const openChat = (chat: Chat) => {
        setSelectedChatId(chat.id);
        setSelectedChat(chat);
        setShowAssign(false);
        setReply("");
    };

    const handleReply = async () => {
        if (!reply.trim() || !selectedChatId) return;
        try {
            await replyChat.mutateAsync({ id: selectedChatId, message: reply });
            setReply("");
        } catch { /* handled in mutation */ }
    };

    const handleAssign = async (employeeId: string) => {
        if (!selectedChatId) return;
        await assignChat.mutateAsync({ id: selectedChatId, employeeId });
        setShowAssign(false);
    };

    const handleClose = async () => {
        if (!selectedChatId) return;
        await closeChat.mutateAsync(selectedChatId);
        setSelectedChatId(null);
        setSelectedChat(null);
    };

    const tabs = [
        { key: "", label: "All", count: stats.total },
        { key: "open", label: "Open", count: stats.open },
        { key: "assigned", label: "Assigned", count: stats.assigned },
        { key: "closed", label: "Closed", count: stats.closed },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Guest Chats</h2>
                    <p className="text-muted-foreground text-sm mt-1">Manage support conversations from guest visitors</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                >
                    <ArrowPathIcon className="h-4 w-4" /> Refresh
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2">
                {tabs.map(({ key, label, count }) => (
                    <button
                        key={label}
                        onClick={() => setStatusFilter(key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${statusFilter === key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border"}`}
                    >
                        {label}
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusFilter === key ? "bg-white/20" : "bg-muted"}`}>{count}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: 500 }}>
                {/* Chat List */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-3 border-b border-border">
                        <p className="text-sm font-medium text-muted-foreground">{chats.length} conversation{chats.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="overflow-y-auto max-h-[450px]">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                            </div>
                        ) : chats.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-12">No chats found</p>
                        ) : (
                            chats.map((c) => (
                                <button key={c.id} onClick={() => openChat(c)} className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${selectedChatId === c.id ? "bg-muted" : ""}`}>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-sm font-medium text-foreground truncate">{c.guest_name}</span>
                                        <StatusBadge status={c.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{c.guest_email}</p>
                                    {c.last_message && <p className="text-xs text-muted-foreground mt-1 truncate">{c.last_message}</p>}
                                    <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(c.updated_at).toLocaleString()} · {c.message_count} msg</p>
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
                                    <p className="text-sm font-semibold text-foreground">
                                        {selectedChat.guest_name}{" "}
                                        <span className="text-muted-foreground font-normal">({selectedChat.guest_email})</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedChat.subject} · {selectedChat.assigned_to ? `Assigned to ${selectedChat.assigned_to}` : "Unassigned"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowAssign(!showAssign)}
                                        className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-xs text-muted-foreground rounded-lg"
                                    >
                                        Assign
                                    </button>
                                    {selectedChat.status !== "closed" && (
                                        <button onClick={handleClose} className="px-2.5 py-1 bg-destructive/20 hover:bg-destructive/30 text-xs text-destructive rounded-lg">
                                            Close
                                        </button>
                                    )}
                                    <button onClick={() => { setSelectedChatId(null); setSelectedChat(null); }}>
                                        <XMarkIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* Assign Dropdown */}
                            {showAssign && (
                                <div className="px-4 py-2 border-b border-border bg-muted">
                                    <p className="text-xs text-muted-foreground mb-2">Assign to:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {employees.map((e) => (
                                            <button key={e.id} onClick={() => handleAssign(e.id)} className="px-2.5 py-1 bg-card hover:bg-primary hover:text-primary-foreground text-xs text-muted-foreground rounded-lg transition-colors">
                                                {e.full_name}
                                            </button>
                                        ))}
                                        {employees.length === 0 && <p className="text-xs text-muted-foreground">No employees found</p>}
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {messagesLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
                                    </div>
                                ) : (
                                    messages.map((m) => (
                                        <div key={m.id} className={`flex ${m.sender_type === "employee" ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.sender_type === "employee" ? "bg-blue-600 text-white rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                                                {m.sender_type === "employee" && m.sender_name && (
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <p className="text-xs text-blue-200 font-medium">{m.sender_name}</p>
                                                        <OnlineBadge online={!!m.sender_online} />
                                                    </div>
                                                )}
                                                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                                <p className={`text-[10px] mt-1 ${m.sender_type === "employee" ? "text-blue-200/60" : "text-muted-foreground"}`}>
                                                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEnd} />
                            </div>

                            {/* Reply Input */}
                            {selectedChat.status !== "closed" && (
                                <div className="px-4 py-3 border-t border-border flex items-center gap-2 flex-shrink-0">
                                    <input
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                                        placeholder="Type a reply…"
                                        className="flex-1 px-3 py-2 bg-muted border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        onClick={handleReply}
                                        disabled={replyChat.isLoading || !reply.trim()}
                                        className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white disabled:opacity-50 flex-shrink-0"
                                    >
                                        <PaperAirplaneIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <ChatBubbleLeftRightIcon className="h-12 w-12 mb-3 opacity-50" />
                            <p className="text-sm">Select a conversation to view</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
