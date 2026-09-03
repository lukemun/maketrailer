"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HelpDialog } from "./HelpDialog";
import type { Design } from "@/lib/schema";

export function DesignLibrary() {
  const router = useRouter();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [name, setName] = useState("Launch offer");
  const [preset, setPreset] = useState("instagram-square");
  const [template, setTemplate] = useState("bold-offer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { void fetch("/api/designs", { cache: "no-store" }).then((r) => r.json()).then((data) => setDesigns(data.designs || [])); }, []);

  async function create() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/designs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, preset, template }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create design");
      router.push(`/designs/${data.design.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create design"); }
    finally { setBusy(false); }
  }

  return (
    <main className="libraryPage">
      <header className="siteHeader">
        <a className="brand" href="/">MakeTrailer<span>•</span> CE</a>
        <div className="localBadge">Local-first</div>
      </header>
      <section className="hero">
        <div>
          <p className="eyebrow">Open source creative tooling</p>
          <div className="headingRow"><h1>An ad canvas your AI agent can operate.</h1><HelpDialog title="How Community Edition works"><p>Your designs and images stay in a local folder on this computer. There is no account or Supabase database.</p><p>Choose a format and starting layout, edit the layers, then export a PNG. Add your own fal.ai key to generate images. Connect the local MCP server to let an AI client create and edit the same designs.</p><p><strong>Example:</strong> create an Instagram square with Bold offer, ask your agent to rewrite the headline and add an image, then open the design here for final adjustments and export.</p></HelpDialog></div>
          <p className="heroCopy">Make focused social ads locally. Bring your own image model key, keep the files, and hand the canvas to any MCP-capable agent.</p>
        </div>
        <div className="createCard">
          <h2>Start a design</h2>
          <label>Design name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <div className="fieldGrid">
            <label>Format<select value={preset} onChange={(event) => setPreset(event.target.value)}><option value="instagram-square">Instagram square</option><option value="instagram-story">Story / Reel</option><option value="facebook-feed">Facebook feed</option><option value="linkedin-feed">LinkedIn feed</option></select></label>
            <label>Starting layout<select value={template} onChange={(event) => setTemplate(event.target.value)}><option value="bold-offer">Bold offer</option><option value="testimonial">Testimonial</option><option value="blank">Blank</option></select></label>
          </div>
          {error ? <p className="errorMessage">{error}</p> : null}
          <button className="button primaryButton" type="button" disabled={busy || !name.trim()} onClick={create}>{busy ? "Creating…" : "Create design"}</button>
        </div>
      </section>
      <section className="designSection">
        <h2>Your local designs</h2>
        {designs.length ? <div className="designGrid">{designs.map((design) => <a className="designCard" href={`/designs/${design.id}`} key={design.id}><div className="miniCanvas" style={{ background: design.background, aspectRatio: `${design.width}/${design.height}` }}><span>{design.elements.length} layers</span></div><strong>{design.name}</strong><small>{design.width} × {design.height}</small></a>)}</div> : <div className="emptyState"><strong>No designs yet.</strong><span>Your first design will be saved to the local data folder.</span></div>}
      </section>
    </main>
  );
}
