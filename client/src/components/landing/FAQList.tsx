import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import "./faq-list.css";

export interface FAQItem {
  question: string;
  answer: string;
  category?: ReactNode;
}

export function FAQList({ items, onOpen }: { items: FAQItem[]; onOpen?: (item: FAQItem) => void }) {
  const id = useId();
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  return <div className="proxy-faq-list">
    {items.map((item, index) => {
      const open = openQuestion === item.question;
      const triggerId = `${id}-question-${index}`;
      const panelId = `${id}-answer-${index}`;
      return <div className="faq-item" key={item.question}>
        <button className="faq-trigger" id={triggerId} type="button" aria-expanded={open} aria-controls={panelId} onClick={() => {
          setOpenQuestion(open ? null : item.question);
          if (!open) onOpen?.(item);
        }}>
          <span>{item.category}{item.question}</span><Plus size={18} aria-hidden="true" />
        </button>
        <div className="faq-panel" id={panelId} role="region" aria-labelledby={triggerId} aria-hidden={!open} data-open={open}>
          <div className="faq-panel-inner"><p>{item.answer}</p></div>
        </div>
      </div>;
    })}
  </div>;
}
