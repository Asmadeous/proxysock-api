import { useState } from "react";
import { CheckIcon, ClipboardIcon } from "@heroicons/react/24/outline";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeBlock = ({ code, language = "", title }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="relative group">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {language}
          </span>
        </div>
      )}
      <div className="relative bg-muted/30 border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-2 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <ClipboardIcon className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
          <code className="text-foreground font-mono">
            {code.split('\n').map((line, index) => (
              <span key={index} className="block">
                <span className="inline-block w-8 text-right text-muted-foreground mr-4 select-none">
                  {index + 1}
                </span>
                <span className="text-foreground">{line}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};
