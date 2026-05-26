import { useState, useEffect, useRef, useCallback } from "react";
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { fetchUserSupportChat, sendUserSupportMessage } from "../../services/api";
import { fetchSupportChat as fetchResellerSupportChat, sendSupportMessage as sendResellerSupportMessage } from "../../services/resellerApi";
import { getCableConsumer } from "../../services/cable";
import { toast } from "sonner";
import type { Subscription } from "@rails/actioncable";

interface SupportChatProps {
    role?: "User" | "Reseller";
}

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

export default function SupportChat({ role = "User" }: SupportChatProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [chatMeta, setChatMeta] = useState<any>({});
    const endRef = useRef<HTMLDivElement>(null);
    const chatIdRef = useRef<string | null>(null);
    const subRef = useRef<Subscription | null>(null);

    const subscribe = useCallback((chatId: string) => {
        if (subRef.current) subRef.current.unsubscribe();
        const consumer = getCableConsumer();
        subRef.current = consumer.subscriptions.create(
            { channel: "ChatChannel", chat_id: chatId, chat_type: "SupportChat" },
            {
                received: (data: any) => {
                    if (data.action === "message_created") {
                        setMessages(prev => {
                            // Deduplicate — skip if real ID already present
                            if (prev.find(m => m.id === data.message.id)) return prev;
                            // Replace optimistic placeholder if body matches
                            const idx = prev.findIndex(m => String(m.id).startsWith("opt-") && m.body === data.message.body);
                            const next = idx >= 0
                                ? prev.map((m, i) => i === idx ? data.message : m)
                                : [...prev, data.message];
                            // Play sound only for incoming (non-user) messages
                            if (data.message.sender_type === "Employee") playNotificationSound();
                            return next;
                        });
                    }
                },
                connected() { console.log("[ChatChannel] Connected to", chatId); },
                disconnected() { console.log("[ChatChannel] Disconnected"); },
            }
        );
    }, []);

    const loadChat = useCallback(async () => {
        try {
            const fetchFn = role === "User" ? fetchUserSupportChat : fetchResellerSupportChat;
            const { data } = await fetchFn();
            setMessages(data.messages || []);
            setChatMeta(data.chat || {});
            return data.chat;
        } catch {
            return null;
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        loadChat().then((chat) => {
            if (chat?.id) {
                chatIdRef.current = chat.id;
                subscribe(chat.id);
            }
        });
        return () => { if (subRef.current) subRef.current.unsubscribe(); };
    }, [loadChat, subscribe]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        const msg = input.trim();
        setInput("");
        setSending(true);

        // Optimistic update — show message immediately
        const optimisticId = `opt-${Date.now()}`;
        const optimistic = {
            id: optimisticId,
            body: msg,
            sender_type: role === "User" ? "User" : "Reseller",
            sender_name: "You",
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);

        try {
            const sendFn = role === "User" ? sendUserSupportMessage : sendResellerSupportMessage;
            const { data } = await sendFn(msg);

            // If the server returned a new chat (old one was closed), resubscribe
            if (data?.chat?.id && data.chat.id !== chatIdRef.current) {
                chatIdRef.current = data.chat.id;
                setChatMeta(data.chat);
                subscribe(data.chat.id);
            }

            // Replace optimistic with confirmed message from server
            if (data?.message) {
                setMessages(prev => prev.map(m => m.id === optimisticId ? data.message : m));
            }
        } catch {
            // Remove failed optimistic message
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary border-r-transparent" />
            <p className="text-sm text-muted-foreground mt-4 animate-pulse">Initializing support session...</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto h-[calc(100vh-10rem)] flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Support Chat</h2>
                    <p className="text-sm text-muted-foreground">Chat with our operators for real-time help.</p>
                </div>
                {chatMeta.assigned_to_name ? (
                    <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-2xl border border-primary/20 backdrop-blur-sm">
                        <div className="relative">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                            <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{chatMeta.assigned_to_name} (Operator)</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-xl border border-border">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-xs font-medium text-muted-foreground italic">Waiting for operator...</span>
                    </div>
                )}
            </div>

            <div className="flex-1 bg-card rounded-[2rem] border border-border flex flex-col overflow-hidden shadow-sm relative">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <ChatBubbleLeftRightIcon className="h-10 w-10 text-primary opacity-50" />
                            </div>
                            <div className="max-w-xs space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">Welcome to Support</h3>
                                <p className="text-sm text-muted-foreground">Send a message below to start a verified conversation with our support team.</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((m: any) => (
                            <div key={m.id} className={`flex ${m.sender_type === "User" || m.sender_type === "Reseller" ? "justify-end" : "justify-start"}`}>
                                <div className={`group relative max-w-[80%] p-4 rounded-2xl text-sm transition-all shadow-sm ${
                                    m.sender_type === "User" || m.sender_type === "Reseller"
                                        ? "bg-primary text-primary-foreground rounded-br-none hover:shadow-primary/20"
                                        : "bg-muted text-foreground rounded-bl-none border border-border/50 hover:shadow-md"
                                } ${String(m.id).startsWith("opt-") ? "opacity-70" : ""}`}>
                                    {m.sender_type === "Employee" && (
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <p className="text-[10px] font-bold text-primary tracking-widest uppercase">{m.sender_name || "Support Team"}</p>
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                                    <p className={`text-[10px] mt-2 font-medium ${m.sender_type === "User" || m.sender_type === "Reseller" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        {String(m.id).startsWith("opt-") && <span className="ml-1 opacity-60">· sending…</span>}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={endRef} />
                </div>

                <div className="p-4 border-t border-border bg-muted/40 backdrop-blur-md">
                    <div className="flex items-end gap-3 max-w-4xl mx-auto">
                        <div className="flex-1 relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Type your message here..."
                                className="w-full bg-background border border-border rounded-2xl px-5 py-3 pr-12 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all min-h-[50px] max-h-[150px] resize-none"
                                rows={1}
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className="bg-primary text-primary-foreground h-12 w-12 rounded-2xl flex items-center justify-center hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-lg shadow-primary/25 shrink-0"
                        >
                            <PaperAirplaneIcon className="h-6 w-6 -rotate-45" />
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-tighter opacity-50 font-bold">End-To-End encrypted internal support line</p>
                </div>
            </div>
        </div>
    );
}
