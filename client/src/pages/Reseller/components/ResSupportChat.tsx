import { useState, useEffect, useCallback, useRef } from "react";
import { PaperAirplaneIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { getApiError } from "@/utils/apiError";
import { fetchSupportChat as fetchResellerSupportChat, sendSupportMessage } from "../../../services/resellerApi";
import { getCableConsumer } from "../../../services/cable";

interface ChatMessage {
    id: string | number;
    body: string;
    sender_type: string;
    sender_name?: string;
    created_at: string;
}

interface ChatMeta {
    id?: string | number;
    assigned_to_name?: string;
}

export default function ResSupportChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [chatMeta, setChatMeta] = useState<ChatMeta>({});
    const endRef = useRef<HTMLDivElement>(null);

    const loadChat = useCallback(async () => {
        try {
            const { data } = await fetchResellerSupportChat();
            setMessages(data.messages || []);
            setChatMeta(data.chat || {});
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadChat();
    }, [loadChat]);

    useEffect(() => {
        let sub: { unsubscribe: () => void } | null = null;
        if (chatMeta.id) {
            const consumer = getCableConsumer();
            sub = consumer.subscriptions.create(
                {
                    channel: "ChatChannel",
                    chat_id: chatMeta.id,
                    chat_type: "SupportChat"
                },
                {
                    received: (data: { action: string; message: ChatMessage }) => {
                        if (data.action === 'message_created') {
                            setMessages(prev => {
                                if (prev.find(m => m.id === data.message.id)) return prev;
                                return [...prev, data.message];
                            });
                        }
                    },
                    connected() { console.log("[Reseller Chat] Connected"); }
                }
            );
        }
        return () => { if (sub) sub.unsubscribe(); };
    }, [chatMeta.id]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const msg = input;
        setInput("");
        try {
            await sendSupportMessage(msg);
            loadChat();
        } catch (err) { toast.error(getApiError(err, "Failed to send message")); }
    };

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>;

    return (
        <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Support Chat</h2>
                    <p className="text-sm text-muted-foreground">Chat with our team for real-time assistance.</p>
                </div>
                {chatMeta.assigned_to_name && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full border border-border">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-foreground">{chatMeta.assigned_to_name} (Assigned)</span>
                    </div>
                )}
            </div>

            <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <ChatBubbleLeftRightIcon className="h-12 w-12 mb-3" />
                            <p>Start a conversation with our support team.</p>
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className={`flex ${m.sender_type === "Reseller" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.sender_type === "Reseller" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none shadow-sm"}`}>
                                    {m.sender_type === "Employee" && (
                                        <p className="text-[10px] font-bold text-primary mb-1">{m.sender_name || "Support"}</p>
                                    )}
                                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                    <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={endRef} />
                </div>

                <div className="p-4 border-t border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Describe your issue..."
                            className="flex-1 bg-background border border-input rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary h-10 resize-none"
                        />
                        <button onClick={handleSend} disabled={!input.trim()} className="bg-primary text-primary-foreground h-10 w-10 rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-all">
                            <PaperAirplaneIcon className="h-5 w-5 -rotate-45" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
