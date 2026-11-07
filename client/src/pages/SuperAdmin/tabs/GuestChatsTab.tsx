import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChatBubbleLeftRightIcon, ArrowPathIcon, XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { getCableConsumer } from "../../../services/cable";
import type { Subscription } from "@rails/actioncable";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
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
        <div className="ws-stack">
            <PageHeader
                title="Guest chats"
                description="Support conversations from visitors who are not signed in."
                actions={<button type="button" onClick={() => refetch()} aria-label="Refresh chats" className="ws-icon-button"><ArrowPathIcon /></button>}
            />

            <div className="ws-tabs" role="group" aria-label="Chat status">
                {tabs.map(({ key, label, count }) => (
                    <button type="button" key={label} aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>{label}<span className="ws-count">{count}</span></button>
                ))}
            </div>

            <div className="ws-inbox">
                <div className="ws-inbox-list">
                    <p>{chats.length} conversation{chats.length !== 1 ? "s" : ""}</p>
                    {isLoading ? (
                        <div className="space-y-3 p-4" role="status" aria-label="Loading chats">
                            <span className="ws-skeleton block" style={{ height: 14 }} />
                            <span className="ws-skeleton block" style={{ height: 14, maxWidth: "70%" }} />
                        </div>
                    ) : chats.length === 0 ? (
                        <p className="!border-0 py-12 text-center">No chats found.</p>
                    ) : (
                        <ul>
                            {chats.map((c) => (
                                <li key={c.id}>
                                    <button type="button" onClick={() => openChat(c)} aria-current={selectedChatId === c.id ? "true" : undefined} className="ws-inbox-item">
                                        <span className="flex items-center justify-between gap-2"><span className="truncate font-medium">{c.guest_name}</span><StatusBadge status={c.status} /></span>
                                        <small>{c.guest_email}</small>
                                        {c.last_message && <small>{c.last_message}</small>}
                                        <small>{new Date(c.updated_at).toLocaleString()} · {c.message_count} msg</small>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="ws-thread">
                    {selectedChat ? (
                        <>
                            <div className="ws-thread-head">
                                <div className="min-w-0">
                                    <h2 className="truncate">{selectedChat.guest_name} <span className="font-normal ws-muted">({selectedChat.guest_email})</span></h2>
                                    <p>{selectedChat.subject} · {selectedChat.assigned_to ? `Assigned to ${selectedChat.assigned_to}` : "Unassigned"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="secondary" aria-expanded={showAssign} onClick={() => setShowAssign(!showAssign)}>Assign</Button>
                                    {selectedChat.status !== "closed" && <Button size="sm" variant="danger" onClick={handleClose}>Close</Button>}
                                    <button type="button" aria-label="Close conversation" className="ws-icon-button" onClick={() => { setSelectedChatId(null); setSelectedChat(null); }}><XMarkIcon /></button>
                                </div>
                            </div>

                            {showAssign && (
                                <div className="border-b border-[var(--ov-line)] px-4 py-3">
                                    <p className="ws-label">Assign to</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {employees.map((e) => <Button key={e.id} size="sm" variant="secondary" onClick={() => handleAssign(e.id)}>{e.full_name}</Button>)}
                                        {employees.length === 0 && <p className="text-xs ws-muted">No employees found.</p>}
                                    </div>
                                </div>
                            )}

                            <div className="ws-messages" role="log" aria-label="Conversation">
                                {messagesLoading ? (
                                    <div className="space-y-3" role="status" aria-label="Loading messages">
                                        <span className="ws-skeleton block" style={{ height: 36, maxWidth: "60%" }} />
                                        <span className="ws-skeleton block self-end" style={{ height: 36, width: "50%" }} />
                                    </div>
                                ) : (
                                    messages.map((m) => {
                                        const own = m.sender_type === "employee";
                                        const pending = String(m.id).startsWith("opt-");
                                        return (
                                            <div key={m.id} className="ws-msg" data-own={own} style={pending ? { opacity: 0.7 } : undefined}>
                                                {own && m.sender_name && !pending && (
                                                    <div className="ws-msg-meta"><span>{m.sender_name}</span><OnlineBadge online={!!m.sender_online} /></div>
                                                )}
                                                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                                <time>
                                                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    {pending && " · sending…"}
                                                </time>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEnd} />
                            </div>

                            {selectedChat.status !== "closed" && (
                                <div className="ws-composer">
                                    <label htmlFor="chat-reply" className="sr-only">Reply</label>
                                    <input
                                        id="chat-reply"
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                                        placeholder="Type a reply…"
                                        className="ws-input flex-1"
                                    />
                                    <Button onClick={handleReply} disabled={replyChat.isLoading || !reply.trim()} aria-label="Send reply"><PaperAirplaneIcon /> Send</Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="ws-thread-empty">
                            <ChatBubbleLeftRightIcon aria-hidden="true" />
                            <h3 className="text-sm font-medium text-[var(--ov-text)]">Select a conversation</h3>
                            <p>Pick a chat on the left to read and reply.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
