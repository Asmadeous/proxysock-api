import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { SidebarGroup } from "./AdminSidebar";

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
    groups: SidebarGroup[];
    onNavigate: (tabId: string) => void;
    activeTab: string;
}

interface FlatItem {
    id: string;
    name: string;
    group: string;
    icon: SidebarGroup["items"][number]["icon"];
}

export default function CommandPalette({
    open,
    onClose,
    groups,
    onNavigate,
    activeTab,
}: CommandPaletteProps) {
    const [query, setQuery] = useState("");
    const [cursor, setCursor] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const allItems = useMemo<FlatItem[]>(() =>
        groups.flatMap((g) =>
            g.items
                .filter((item) => item.id !== "logout")
                .map((item) => ({ id: item.id, name: item.name, group: g.label ?? "", icon: item.icon }))
        ), [groups]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? allItems.filter((item) => item.name.toLowerCase().includes(q)) : allItems;
    }, [query, allItems]);

    // Reset state when opening
    useEffect(() => {
        if (open) {
            setQuery("");
            setCursor(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Keep cursor in bounds when results change
    useEffect(() => {
        setCursor((c) => Math.min(c, Math.max(filtered.length - 1, 0)));
    }, [filtered.length]);

    // Scroll active item into view
    useEffect(() => {
        const el = listRef.current?.children[cursor] as HTMLElement | undefined;
        el?.scrollIntoView({ block: "nearest" });
    }, [cursor]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") { onClose(); return; }
            if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, filtered.length - 1)); }
            if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
            if (e.key === "Enter" && filtered[cursor]) {
                onNavigate(filtered[cursor].id);
                onClose();
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open, cursor, filtered, onNavigate, onClose]);

    const handleSelect = (id: string) => {
        onNavigate(id);
        onClose();
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Command palette"
                    initial={{ opacity: 0, scale: 0.97, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="relative w-full max-w-[95vw] sm:max-w-lg bg-[var(--ov-panel)] border border-[var(--ov-line)] rounded overflow-hidden"
                >
                    {/* Search input */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--ov-line)]">
                        <MagnifyingGlassIcon className="h-5 w-5 ws-muted flex-shrink-0" aria-hidden="true" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
                            placeholder="Go to..."
                            className="flex-1 bg-transparent text-[var(--ov-text)] placeholder-muted-foreground text-sm focus:outline-none"
                            aria-label="Search tabs"
                            autoComplete="off"
                        />
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[var(--ov-line)] text-[10px] ws-muted font-mono select-none">
                            Esc
                        </kbd>
                    </div>

                    {/* Results */}
                    <ul
                        ref={listRef}
                        className="max-h-72 overflow-y-auto py-2 custom-scrollbar"
                        role="listbox"
                        aria-label="Navigation options"
                    >
                        {filtered.length === 0 ? (
                            <li className="px-4 py-8 text-center text-sm ws-muted">
                                No results for &ldquo;{query}&rdquo;
                            </li>
                        ) : (
                            filtered.map((item, i) => {
                                const isActive = item.id === activeTab;
                                const isCursor = i === cursor;
                                return (
                                    <li
                                        key={item.id}
                                        role="option"
                                        aria-selected={isCursor}
                                        onClick={() => handleSelect(item.id)}
                                        onMouseEnter={() => setCursor(i)}
                                        className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${isCursor ? "bg-[var(--ov-wash)] shadow-[inset_2px_0_0_var(--ov-accent)]" : ""}`}
                                    >
                                        <item.icon className={`h-4 w-4 shrink-0 ${isCursor ? "text-[var(--ov-accent)]" : "ws-muted"}`} aria-hidden="true" />
                                        <span className={`flex-1 text-xs ${isCursor ? "text-[var(--ov-text)]" : "ws-muted"}`}>
                                            {item.name}
                                        </span>
                                        {item.group && (
                                            <span className="text-[10px] ws-muted uppercase tracking-wider select-none">
                                                {item.group}
                                            </span>
                                        )}
                                        {isActive && (
                                            <span className="select-none text-[10px] text-[var(--ov-accent)]">
                                                current
                                            </span>
                                        )}
                                    </li>
                                );
                            })
                        )}
                    </ul>

                    {/* Footer hint */}
                    <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--ov-line)] bg-[var(--ov-wash)]">
                        <span className="flex items-center gap-1.5 text-[11px] ws-muted">
                            <kbd className="px-1 py-0.5 rounded border border-[var(--ov-line)] font-mono text-[10px]">↑↓</kbd>
                            navigate
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] ws-muted">
                            <kbd className="px-1 py-0.5 rounded border border-[var(--ov-line)] font-mono text-[10px]">↵</kbd>
                            open
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] ws-muted">
                            <kbd className="px-1 py-0.5 rounded border border-[var(--ov-line)] font-mono text-[10px]">Esc</kbd>
                            close
                        </span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
