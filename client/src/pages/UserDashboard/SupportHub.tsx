import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SupportChat from "./SupportChat";
import Tickets from "./Tickets";
import { ChatBubbleLeftRightIcon, TicketIcon } from "@heroicons/react/24/outline";

export default function SupportHub() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Check if URL has ?tab=tickets or ?tab=chat
    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get("tab") === "tickets" ? "tickets" : "chat";
    const [activeTab, setActiveTab] = useState<"chat" | "tickets">(initialTab);

    // Sync tab state with URL (optional but good for direct links)
    useEffect(() => {
        const tab = queryParams.get("tab");
        if (tab === "tickets" || tab === "chat") {
            setActiveTab(tab);
        }
    }, [location.search]);

    const handleTabChange = (tab: "chat" | "tickets") => {
        setActiveTab(tab);
        navigate(`/dashboard/support?tab=${tab}`, { replace: true });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Support Center</h1>
                    <p className="text-muted-foreground mt-1">Get help via live chat or manage your support tickets.</p>
                </div>
            </div>

            {/* Sub-menu tabs */}
            <div className="flex gap-2 border-b border-border pb-px">
                <button
                    onClick={() => handleTabChange("chat")}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "chat"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    Live Chat
                </button>
                <button
                    onClick={() => handleTabChange("tickets")}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "tickets"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                >
                    <TicketIcon className="h-4 w-4" />
                    Support Tickets
                </button>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === "chat" ? (
                    <SupportChat role="User" />
                ) : (
                    <Tickets role="User" />
                )}
            </div>
        </div>
    );
}
