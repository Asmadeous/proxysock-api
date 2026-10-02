import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "./CodeBlock";
import { tutorialServices } from "./tutorial-guides";

export const HowToConnectTabs = () => {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const guideHeading = useRef<HTMLHeadingElement>(null);
  const service = tutorialServices.find((item) => item.id === params.get("service")) ?? tutorialServices[0];
  const guide = service.guides.find((item) => item.id === params.get("guide")) ?? service.guides[0];
  const searchResults = query.trim() ? tutorialServices.flatMap((item) => item.guides.filter((entry) => `${item.name} ${entry.label} ${entry.title} ${entry.description}`.toLowerCase().includes(query.trim().toLowerCase())).map((entry) => ({ service: item, guide: entry }))) : [];

  function selectGuide(serviceId: string, guideId?: string) {
    const next = new URLSearchParams(params);
    next.set("service", serviceId);
    if (guideId) next.set("guide", guideId); else next.delete("guide");
    setParams(next, { preventScrollReset: true });
  }

  return (
    <section className="tutorial-workspace" id="setup-guides" aria-label="Setup guides">
      <Tabs value={service.id} onValueChange={(value) => selectGuide(value)} orientation="vertical" activationMode="manual" className="tutorial-workspace-layout">
        <aside className="tutorial-sidebar">
          <p className="proxy-eyebrow">The connection library</p>
          <h2>What are you<br />setting up?</h2>
          <div className="tutorial-search"><Search size={15} aria-hidden="true" /><input type="search" aria-label="Search guides" placeholder="Search guides" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} aria-hidden="true" /></button>}</div>
          {query.trim() ? <div className="tutorial-search-results"><p role="status">{searchResults.length ? `${searchResults.length} guides found` : "No guides found. Try SSH, Windows or eSIM."}</p>{searchResults.map((result) => <button key={`${result.service.id}-${result.guide.id}`} type="button" aria-label={`${result.service.name} / ${result.guide.label}`} onClick={() => { selectGuide(result.service.id, result.guide.id); setQuery(""); requestAnimationFrame(() => guideHeading.current?.focus()); }}><span>{result.service.name}</span>{result.guide.label}<ArrowRight size={14} aria-hidden="true" /></button>)}</div> : null}
          <TabsList className="tutorial-services" aria-label="Service guides">{tutorialServices.map((item) => <TabsTrigger key={item.id} id={`service-tab-${item.id}`} value={item.id} aria-controls="tutorial-panel" className="tutorial-service"><span>{item.name}</span><span>{item.guides.length} guides</span><ArrowUpRight size={15} aria-hidden="true" /></TabsTrigger>)}</TabsList>
          <Link className="tutorial-sidebar-support" to="/contact">Need a hand? <span>Contact support <ArrowUpRight size={13} aria-hidden="true" /></span></Link>
        </aside>
        <div className="tutorial-main" id="tutorial-panel" role="tabpanel" aria-labelledby={`service-tab-${service.id}`}>
          <div className="tutorial-service-heading"><div><p className="proxy-eyebrow">{service.name} / Setup guides</p><p>{service.description}</p></div><Link to={service.dashboard}>Your {service.name === "Proxies" ? "proxies" : service.name} <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
          <div className="tutorial-topic-list" role="group" aria-label={`${service.name} topics`}>{service.guides.map((item) => <button type="button" key={item.id} aria-pressed={item.id === guide.id} onClick={() => selectGuide(service.id, item.id)} aria-controls="tutorial-article">{item.label}</button>)}</div>
          <article className="tutorial-article" id="tutorial-article" key={`${service.id}-${guide.id}`}>
            <header><h2 ref={guideHeading} tabIndex={-1}>{guide.title}</h2><p>{guide.description}</p></header>
            <div className="tutorial-instructions">
              <ol className="tutorial-steps">{guide.steps.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol>
              <div className="tutorial-example"><CodeBlock key={guide.id} code={guide.code} language={guide.language} title={guide.filename} /><div className="tutorial-note"><h3>Good to know</h3><p>{guide.note}</p></div></div>
            </div>
            <div className="tutorial-article-footer"><span>Still need help? <Link to="/contact">Talk to our team</Link></span>{guide.source && <a href={guide.source[1]} target="_blank" rel="noreferrer">{guide.source[0]} <ArrowUpRight size={13} aria-hidden="true" /></a>}</div>
          </article>
        </div>
      </Tabs>
    </section>
  );
};
