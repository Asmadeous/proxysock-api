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
    useSupportChats,
    useSupportChatDetail,
    useReplySupportChat,
    useAssignSupportChat,
    useCloseSupportChat,
} from "../queries/supportChats.queries";
import { useChatEmployees } from "../queries/guestChats.queries";
import { adminQueryKeys } from "../queries/queryKeys";

// Play a soft notification beep using Web Audio API — no asset required
function playNotificationSound() {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        osc.onended = () => ctx.close();
    } catch {
        // Audio not available — silently ignore
    }
}

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
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [reply, setReply] = useState("");
    const [showAssign, setShowAssign] = useState(false);
    const messagesEnd = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const { data: chatsData, isLoading, refetch } = useSupportChats({ statusFilter: "" });
    const { data: chatDetail, isLoading: messagesLoading } = useSupportChatDetail(selectedChatId);
    const { data: employeesData } = useChatEmployees();

    const chats: Chat[] = chatsData?.chats || [];
    const messages: Message[] = chatDetail?.messages || [];
    const employees: { id: string; full_name: string }[] = (employeesData?.employees || []).map((e: Record<string, unknown>) => ({
        id: String(e.id),
        full_name: String(e.full_name || e.email),
    }));

    const replyChat = useReplySupportChat();
    const assignChat = useAssignSupportChat();
    const closeChat = useCloseSupportChat();

    // WebSocket subscription — appends messages directly to the query cache
    useEffect(() => {
        if (!selectedChatId) return;
        let sub: Subscription | null = null;
        const consumer = getCableConsumer();
        sub = consumer.subscriptions.create(
            { channel: "ChatChannel", chat_id: selectedChatId, chat_type: "SupportChat" },
            {
                received: (data: { action: string; message: Message }) => {
                    if (data.action === "message_created") {
                        queryClient.setQueryData(
                            adminQueryKeys.supportChats.detail(selectedChatId),
                            (old: { messages?: Message[] } | undefined) => {
                                if (!old) return old;
                                const msgs = old.messages || [];
                                if (msgs.find((m) => m.id === data.message.id)) return old;
                                // Play sound for incoming non-employee messages
                                if (data.message.sender_type !== "Employee") {
                                    playNotificationSound();
                                }
                                return { ...old, messages: [...msgs, data.message] };
                            }
                        );
                    }
                },
                connected() { console.log("[Admin SupportChat] Connected"); },
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
        const msgText = reply.trim();
        setReply("");

        // Optimistic update
        const optimisticId = `opt-${Date.now()}`;
        const optimisticMessage: Message = {
            id: optimisticId,
            body: msgText,
            sender_type: "Employee",
            sender_name: "You",
            created_at: new Date().toISOString()
        };

        queryClient.setQueryData(
            adminQueryKeys.supportChats.detail(selectedChatId),
            (old: { messages?: Message[] } | undefined) => {
                if (!old) return old;
                return { ...old, messages: [...(old.messages || []), optimisticMessage] };
            }
        );

        try {
            await replyChat.mutateAsync({ id: selectedChatId, message: msgText });
            // The mutation invalidates the query or websocket replaces it, 
            // so we don't strictly need to manually swap it here.
        } catch {
            // Revert optimistic update on failure
            queryClient.setQueryData(
                adminQueryKeys.supportChats.detail(selectedChatId),
                (old: { messages?: Message[] } | undefined) => {
                    if (!old) return old;
                    return { ...old, messages: (old.messages || []).filter(m => m.id !== optimisticId) };
                }
            );
        }
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

    return (
        <div className="ws-stack">
            <PageHeader
                title="Support chats"
                description="Real-time support for signed-in customers and resellers."
                actions={<button type="button" onClick={() => refetch()} aria-label="Refresh chats" className="ws-icon-button"><ArrowPathIcon /></button>}
            />

            <div className="ws-inbox">
                <div className="ws-inbox-list">
                    <p>{chats.length} active chat{chats.length !== 1 ? "s" : ""}</p>
                    {isLoading ? (
                        <div className="space-y-3 p-4" role="status" aria-label="Loading chats">
                            <span className="ws-skeleton block" style={{ height: 14 }} />
                            <span className="ws-skeleton block" style={{ height: 14, maxWidth: "70%" }} />
                        </div>
                    ) : chats.length === 0 ? (
                        <p className="!border-0 py-12 text-center">No active support chats.</p>
                    ) : (
                        <ul>
                            {chats.map((c) => (
                                <li key={c.id}>
                                    <button type="button" onClick={() => openChat(c)} aria-current={selectedChatId === c.id ? "true" : undefined} className="ws-inbox-item">
                                        <span className="flex items-center justify-between gap-2"><span className="truncate font-medium">{c.chatable_name}</span><StatusBadge status={c.status} /></span>
                                        <small>{c.chatable_type}</small>
                                        <small>{new Date(c.updated_at).toLocaleString()}</small>
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
                                    <h2 className="truncate">{selectedChat.chatable_name} <span className="font-normal ws-muted">({selectedChat.chatable_type})</span></h2>
                                    <p>{selectedChat.assigned_to ? `Assigned to ${selectedChat.assigned_to}` : "Unassigned"}</p>
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
                                        const own = m.sender_type === "Employee";
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
                            <h3 className="text-sm font-medium text-[var(--ov-text)]">Support center</h3>
                            <p>Pick a conversation on the left to start chatting with verified customers.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
