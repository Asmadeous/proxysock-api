import { useState, useEffect, useRef, useCallback } from "react";
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { fetchUserSupportChat, sendUserSupportMessage } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

interface Message {
    id: string;
    body: string;
    sender_type: "guest" | "employee" | "User" | "Employee";
    sender_name?: string;
    sender_online?: boolean;
    created_at: string;
}

interface ChatState {
    sessionToken: string | null;
    chatId: string | null;
    guest_name: string;
    guest_email: string;
}

interface ChatMetadata {
    assigned_to_name?: string;
    assigned_to_online?: boolean;
}

export default function ChatWidget() {
    const { user } = useAuth();
    const isAuthenticated = !!user;

    const [open, setOpen] = useState(false);
    const [started, setStarted] = useState(isAuthenticated); // Auto-start for logged-in users
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [chat, setChat] = useState<ChatState>(() => {
        const stored = localStorage.getItem("guestChat");
        return stored ? JSON.parse(stored) : { sessionToken: null, chatId: null, guest_name: "", guest_email: "" };
    });
    const [chatMetadata, setChatMetadata] = useState<ChatMetadata>({});
    const [sending, setSending] = useState(false);
    const messagesEnd = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval>>();

    const scrollBottom = () => messagesEnd.current?.scrollIntoView({ behavior: "smooth" });

    // Auto-start for authenticated users
    useEffect(() => {
        if (isAuthenticated) setStarted(true);
    }, [isAuthenticated]);

    // Persist guest chat state
    useEffect(() => {
        if (!isAuthenticated) {
            localStorage.setItem("guestChat", JSON.stringify(chat));
            if (chat.sessionToken) setStarted(true);
        }
    }, [chat, isAuthenticated]);

    // Poll for messages
    const fetchMessages = useCallback(async () => {
        try {
            if (isAuthenticated) {
                // Authenticated user → use support_chats API
                const { data } = await fetchUserSupportChat();
                setMessages(data.messages || []);
                if (data.chat) {
                    setChatMetadata({
                        assigned_to_name: data.chat.assigned_to_name,
                        assigned_to_online: data.chat.assigned_to_online
                    });
                }
            } else if (chat.sessionToken) {
                // Guest → use guest_chats API
                const res = await fetch(`${API_URL}/guest_chats/${chat.sessionToken}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                    if (data.chat) {
                        setChatMetadata({
                            assigned_to_name: data.chat.assigned_to_name,
                            assigned_to_online: data.chat.assigned_to_online
                        });
                    }
                }
            }
        } catch { /* polling error ignored */ }
    }, [isAuthenticated, chat.sessionToken]);

    useEffect(() => {
        const canPoll = isAuthenticated || chat.sessionToken;
        if (open && canPoll) {
            fetchMessages();
            pollRef.current = setInterval(fetchMessages, 5000);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [open, isAuthenticated, chat.sessionToken, fetchMessages]);

    // Allow external components to open the chat
    useEffect(() => {
        const handleOpenChat = () => setOpen(true);
        window.addEventListener("open-chat", handleOpenChat);
        return () => window.removeEventListener("open-chat", handleOpenChat);
    }, []);

    useEffect(scrollBottom, [messages]);

    // Guest: start new chat
    const startChat = async () => {
        if (!chat.guest_name.trim() || !chat.guest_email.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`${API_URL}/guest_chats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ guest_name: chat.guest_name, guest_email: chat.guest_email, subject: "General Inquiry", message: input || "Hello, I have a question." }),
            });
            if (res.ok) {
                const data = await res.json();
                setChat((prev) => ({ ...prev, sessionToken: data.session_token, chatId: data.chat.id }));
                setInput("");
                setStarted(true);
                await fetchMessages();
            }
        } catch { /* error */ }
        setSending(false);
    };

    // Send message (authenticated or guest)
    const sendMessage = async () => {
        if (!input.trim()) return;
        setSending(true);
        try {
            if (isAuthenticated) {
                await sendUserSupportMessage(input);
            } else if (chat.sessionToken) {
                await fetch(`${API_URL}/guest_chats/${chat.sessionToken}/messages`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: input }),
                });
            }
            setInput("");
            await fetchMessages();
        } catch { /* error */ }
        setSending(false);
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            started ? sendMessage() : startChat();
        }
    };

    // Don't render on any dashboard pages
    if (typeof window !== "undefined" && (
        window.location.pathname.startsWith("/admin") ||
        window.location.pathname.startsWith("/sadmin") ||
        window.location.pathname.startsWith("/employee") ||
        window.location.pathname.startsWith("/reseller") ||
        window.location.pathname.startsWith("/dashboard")
    )) {
        return null;
    }

    const isMe = (senderType: string) =>
        senderType === "guest" || senderType === "User";

    return (
        <>
            {/* Floating Bubble */}
            {!open && (
                <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                    <ChatBubbleLeftRightIcon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full" />
                </button>
            )}

            {/* Chat Window */}
            {open && (
                <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: "480px" }}>
                    {/* Header */}
                    <div className="bg-primary px-4 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            {chatMetadata.assigned_to_name ? (
                                <div className="h-9 w-9 rounded-full bg-background/20 flex items-center justify-center text-primary-foreground font-bold relative">
                                    {chatMetadata.assigned_to_name.charAt(0)}
                                    <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-primary ${chatMetadata.assigned_to_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                                </div>
                            ) : null}
                            <div>
                                <p className="text-primary-foreground font-semibold text-sm">
                                    {chatMetadata.assigned_to_name || "ProxySock Support"}
                                </p>
                                <p className="text-primary-foreground/80 text-xs">
                                    {chatMetadata.assigned_to_online ? "Active Now" : "Typically replies in minutes"}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground"><XMarkIcon className="h-5 w-5" /></button>
                    </div>

                    {!started ? (
                        /* Guest Start Form */
                        <div className="flex-1 flex flex-col p-4 gap-3 justify-center">
                            <h3 className="text-foreground font-semibold text-center">Start a Conversation</h3>
                            <p className="text-muted-foreground text-xs text-center">Enter your details below and we'll get back to you shortly.</p>
                            <input
                                type="text" placeholder="Your name" value={chat.guest_name} autoFocus
                                onChange={(e) => setChat((p) => ({ ...p, guest_name: e.target.value }))}
                                className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                            />
                            <input
                                type="email" placeholder="Email address" value={chat.guest_email}
                                onChange={(e) => setChat((p) => ({ ...p, guest_email: e.target.value }))}
                                className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                            />
                            <textarea
                                placeholder="How can we help?" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} rows={2}
                                className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                            />
                            <button onClick={startChat} disabled={sending || !chat.guest_name || !chat.guest_email}
                                className="py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                                {sending ? "Starting…" : "Start Chat"}
                            </button>
                        </div>
                    ) : (
                        /* Messages */
                        <>
                            {/* Authenticated user greeting */}
                            {isAuthenticated && messages.length === 0 && (
                                <div className="p-4 text-center space-y-2 flex-1 flex flex-col items-center justify-center">
                                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                                        <ChatBubbleLeftRightIcon className="h-7 w-7 text-primary" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">
                                        Hey {user?.first_name || user?.username || "there"}! 👋
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Send a message to chat with our support team.
                                    </p>
                                </div>
                            )}

                            {messages.length > 0 && (
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    {messages.map((m) => (
                                        <div key={m.id} className={`flex ${isMe(m.sender_type) ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isMe(m.sender_type) ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md shadow-sm"
                                                }`}>
                                                {!isMe(m.sender_type) && (
                                                    <p className="text-[10px] text-primary font-bold mb-1 flex items-center gap-1">
                                                        {m.sender_name || "Support"}
                                                        <span className={`h-1.5 w-1.5 rounded-full ${m.sender_online ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`} title={m.sender_online ? "Online" : "Offline"} />
                                                    </p>
                                                )}
                                                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                                <p className={`text-[10px] mt-1 ${isMe(m.sender_type) ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEnd} />
                                </div>
                            )}

                            {/* Input */}
                            <div className="px-3 py-2 border-t border-border flex items-center gap-2 flex-shrink-0">
                                <input
                                    value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
                                    placeholder="Type a message…" autoFocus
                                    className="flex-1 px-3 py-2 bg-background border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                                />
                                <button onClick={sendMessage} disabled={sending || !input.trim()}
                                    className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-primary-foreground disabled:opacity-50 transition-colors flex-shrink-0">
                                    <PaperAirplaneIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
