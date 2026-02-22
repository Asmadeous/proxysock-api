import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock = ({
  code,
  language = "bash",
  title,
  showLineNumbers = false,
}: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="group relative bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
          <span className="text-sm text-slate-400 font-medium">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              {language}
            </span>
          </div>
        </div>
      )}
      <div className="relative">
        <button
          onClick={copyToClipboard}
          className="absolute right-2 top-2 z-10 p-2 rounded-md bg-slate-800 text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
          <code className="text-slate-50">
            {showLineNumbers ? (
              lines.map((line, index) => (
                <div key={index} className="table-row">
                  <span className="table-cell text-slate-600 pr-4 select-none w-8 text-right">
                    {index + 1}
                  </span>
                  <span className="table-cell">{line}</span>
                </div>
              ))
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
};
