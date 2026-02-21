import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface Option {
    value: string;
    label: string;
    flagUrl?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    required?: boolean;
    id?: string;
    icon?: React.ReactNode;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder,
    disabled,
    required,
    id,
    icon,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selected = options.find((o) => o.value === value);

    const filtered = search
        ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (isOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Hidden input for form validation */}
            {required && (
                <input
                    tabIndex={-1}
                    value={value}
                    required
                    onChange={() => { }}
                    className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                />
            )}

            {/* Trigger button */}
            <button
                type="button"
                id={id}
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className="pl-10 pr-8 py-3 w-full rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-ring text-foreground transition-colors disabled:opacity-50 font-inter-regular text-left flex items-center gap-2 cursor-pointer"
            >
                {/* Left icon */}
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    {selected?.flagUrl ? (
                        <img src={selected.flagUrl} alt="" className="w-5 h-4 object-cover rounded-sm" />
                    ) : (
                        icon
                    )}
                </span>

                <span className={selected ? "text-foreground" : "text-muted-foreground"}>
                    {selected ? selected.label : placeholder}
                </span>

                <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-background border border-input rounded-lg shadow-xl max-h-64 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-input">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="pl-8 pr-3 py-2 w-full rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-ring font-inter-regular"
                            />
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="overflow-y-auto max-h-48">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                                No results found
                            </div>
                        ) : (
                            filtered.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => handleSelect(o.value)}
                                    className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-accent transition-colors text-sm ${o.value === value ? "bg-accent/50 font-medium" : ""
                                        }`}
                                >
                                    {o.flagUrl && (
                                        <img src={o.flagUrl} alt="" className="w-5 h-4 object-cover rounded-sm flex-shrink-0" />
                                    )}
                                    <span className="text-foreground">{o.label}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
