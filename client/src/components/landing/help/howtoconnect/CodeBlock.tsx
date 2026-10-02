import { useEffect, useRef, useState } from "react";
import { Check, Copy, WrapText } from "lucide-react";
import "./terminal.css";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock = ({ code, language = "bash", title = "Terminal", showLineNumbers = true }: CodeBlockProps) => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [wrap, setWrap] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(resetTimer.current), []);
  useEffect(() => { setCopyState("idle"); }, [code]);

  async function copyToClipboard() {
    clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
      resetTimer.current = setTimeout(() => setCopyState("idle"), 2200);
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className={`guide-terminal ${wrap ? "guide-terminal-wrap" : ""}`}>
      <div className="guide-terminal-bar">
        <div className="guide-terminal-title"><span className="guide-terminal-lights" aria-hidden="true"><i /><i /><i /></span><span>{title}</span></div>
        <div className="guide-terminal-controls">
          <button type="button" onClick={() => setWrap(!wrap)} aria-pressed={wrap} aria-label="Wrap lines" title="Wrap lines"><WrapText size={15} aria-hidden="true" /></button>
          <button type="button" onClick={copyToClipboard} aria-label={`Copy ${title}`}><span aria-hidden="true">{copyState === "copied" ? <Check size={14} /> : <Copy size={14} />}</span>{copyState === "copied" ? "Copied" : "Copy"}</button>
        </div>
      </div>
      <pre tabIndex={0} aria-label={`${title} example`}><code>{code.split("\n").map((line, i) => (
        <span className={`guide-code-line ${line.trimStart().startsWith("#") ? "guide-code-comment" : ""}`} key={i}>
          {showLineNumbers && <span className="guide-code-number" aria-hidden="true">{i + 1}</span>}
          <span className="guide-code-text">{line || " "}</span>
        </span>
      ))}</code></pre>
      <div className="guide-terminal-foot"><span>{language === "text" ? "Configuration reference" : language}</span><span>Example · replace placeholders</span></div>
      <p className={copyState === "error" ? "guide-copy-error" : "sr-only"} role="status">{copyState === "copied" ? "Code copied to clipboard." : copyState === "error" ? "Couldn't copy automatically. Select the example above and copy it manually." : ""}</p>
    </div>
  );
};
