"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { Design, DesignElement, ImageElement } from "@/lib/schema";
import { HelpDialog } from "./HelpDialog";

type SaveState = "saved" | "saving" | "changed" | "error";

export function DesignEditor({ designId }: { designId: string }) {
  const [design, setDesign] = useState<Design | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [falReady, setFalReady] = useState(false);
  const [message, setMessage] = useState("");
  const [viewportWidth, setViewportWidth] = useState(1440);
  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = design?.elements.find((element) => element.id === selectedId) || null;
  const scale = useMemo(() => design ? viewportWidth <= 620 ? Math.min((viewportWidth - 32) / design.width, 0.6) : Math.min(720 / design.width, 720 / design.height) : 1, [design, viewportWidth]);

  useEffect(() => {
    void Promise.all([fetch(`/api/designs/${designId}`, { cache: "no-store" }).then((r) => r.json()), fetch("/api/generate").then((r) => r.json())]).then(([designData, config]) => { setDesign(designData.design); setFalReady(Boolean(config.configured)); });
  }, [designId]);

  useEffect(() => {
    const measure = () => setViewportWidth(window.innerWidth);
    measure(); window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const persist = useCallback(async (next: Design) => {
    setSaveState("saving");
    try {
      const response = await fetch(`/api/designs/${next.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(next) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDesign(data.design); setSaveState("saved");
    } catch { setSaveState("error"); }
  }, []);

  function mutate(change: (current: Design) => Design, immediate = false) {
    setDesign((current) => {
      if (!current) return current;
      const next = change(current); setSaveState("changed");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (immediate) void persist(next); else saveTimer.current = setTimeout(() => void persist(next), 500);
      return next;
    });
  }

  function updateSelected(patch: Record<string, unknown>) {
    if (!selectedId) return;
    mutate((current) => ({ ...current, elements: current.elements.map((element) => element.id === selectedId ? { ...element, ...patch } as DesignElement : element) }));
  }

  function moveSelected(direction: -1 | 1) {
    if (!selectedId) return;
    mutate((current) => {
      const index = current.elements.findIndex((element) => element.id === selectedId);
      const destination = Math.max(0, Math.min(current.elements.length - 1, index + direction));
      if (index < 0 || destination === index) return current;
      const elements = [...current.elements];
      const [element] = elements.splice(index, 1);
      elements.splice(destination, 0, element);
      return { ...current, elements };
    }, true);
  }

  function addText() {
    if (!design) return;
    const element: DesignElement = { id: crypto.randomUUID(), type: "text", text: "Your headline", color: "#17120f", fontSize: Math.round(design.width * 0.04), fontWeight: 700, align: "left", x: design.width * 0.15, y: design.height * 0.52, width: design.width * 0.7, height: design.height * 0.1, rotation: 0, opacity: 1 };
    mutate((current) => ({ ...current, elements: [...current.elements, element] }), true); setSelectedId(element.id);
  }

  function addShape() {
    if (!design) return;
    const element: DesignElement = { id: crypto.randomUUID(), type: "shape", fill: "#ffd9bf", radius: 28, x: design.width * 0.2, y: design.height * 0.25, width: design.width * 0.6, height: design.height * 0.32, rotation: 0, opacity: 1 };
    mutate((current) => ({ ...current, elements: [...current.elements, element] }), true); setSelectedId(element.id);
  }

  async function upload(file: File) {
    if (!design) return;
    const form = new FormData(); form.set("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: form }); const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Upload failed"); return; }
    const element: ImageElement = { id: crypto.randomUUID(), type: "image", src: data.src, alt: file.name, fit: "cover", x: design.width * 0.18, y: design.height * 0.43, width: design.width * 0.64, height: design.height * 0.32, rotation: 0, opacity: 1 };
    mutate((current) => { const elements = [...current.elements]; const firstText = elements.findIndex((candidate) => candidate.type === "text"); elements.splice(firstText < 0 ? elements.length : firstText, 0, element); return { ...current, elements }; }, true); setSelectedId(element.id);
  }

  async function generate() {
    if (!design) return; setGenerating(true); setMessage("");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ designId: design.id, prompt }) }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed"); setDesign(data.design); setSelectedId(data.design.elements.at(-1)?.id || null); setSaveState("saved");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Generation failed"); }
    finally { setGenerating(false); }
  }

  async function exportPng() {
    if (!canvasRef.current || !design) return;
    setSelectedId(null); await new Promise((resolve) => setTimeout(resolve, 50));
    const url = await toPng(canvasRef.current, { width: design.width, height: design.height, pixelRatio: 1, style: { transform: "none", width: `${design.width}px`, height: `${design.height}px` } });
    const link = document.createElement("a"); link.download = `${design.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`; link.href = url; link.click();
  }

  function beginDrag(event: React.PointerEvent, element: DesignElement) {
    event.currentTarget.setPointerCapture(event.pointerId); setSelectedId(element.id);
    const origin = { clientX: event.clientX, clientY: event.clientY, x: element.x, y: element.y };
    const move = (moveEvent: PointerEvent) => mutate((current) => ({ ...current, elements: current.elements.map((candidate) => candidate.id === element.id ? { ...candidate, x: Math.round(origin.x + (moveEvent.clientX - origin.clientX) / scale), y: Math.round(origin.y + (moveEvent.clientY - origin.clientY) / scale) } : candidate) }));
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  }

  if (!design) return <main className="loadingPage">Opening local design…</main>;

  return (
    <main className="editorPage">
      <header className="editorHeader"><a className="backLink" href="/">← Designs</a><input className="titleInput" value={design.name} aria-label="Design name" onChange={(event) => mutate((current) => ({ ...current, name: event.target.value }))} /><span className={`saveState ${saveState}`}>{saveState === "saving" ? "Saving…" : saveState === "changed" ? "Unsaved" : saveState === "error" ? "Save failed" : "Saved locally"}</span><button className="button secondaryButton" type="button" onClick={exportPng}>Export PNG</button><HelpDialog title="Editing and exporting"><p>Click a layer to edit it. Drag it directly on the canvas or use exact position and size fields in the inspector. Every change is saved to your local data directory.</p><p>Generate uses the server-side fal key and adds the downloaded result as an ordinary editable image layer. Export creates a full-resolution PNG in your browser.</p><p><strong>Example:</strong> generate a product background, use the layer controls to place it behind the headline, adjust the headline contrast, then export.</p></HelpDialog></header>
      <div className="editorShell">
        <aside className="leftPanel"><h2>Add</h2><button className="toolButton" type="button" onClick={addText}>T <span>Text</span></button><button className="toolButton" type="button" onClick={addShape}>□ <span>Shape</span></button><label className="toolButton uploadButton">↑ <span>Image</span><input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])} /></label><hr/><h2>Layers</h2><div className="layerList">{[...design.elements].reverse().map((element) => <button className={element.id === selectedId ? "layerButton selected" : "layerButton"} type="button" key={element.id} onClick={() => setSelectedId(element.id)}><span>{element.type === "text" ? "T" : element.type === "image" ? "▧" : "□"}</span>{element.type === "text" ? element.text.slice(0, 24) : element.type === "image" ? element.alt || "Image" : "Shape"}</button>)}</div></aside>
        <section className="canvasStage" onPointerDown={() => setSelectedId(null)}><div className="canvasFrame" style={{ width: design.width * scale, height: design.height * scale }}><div ref={canvasRef} className="designCanvas" style={{ width: design.width, height: design.height, background: design.background, transform: `scale(${scale})` }} onPointerDown={(event) => event.stopPropagation()}>{design.elements.map((element) => <div key={element.id} className={`canvasElement ${element.id === selectedId ? "selectedElement" : ""}`} style={{ left: element.x, top: element.y, width: element.width, height: element.height, opacity: element.opacity, transform: `rotate(${element.rotation}deg)`, borderRadius: element.type === "shape" ? element.radius : undefined, background: element.type === "shape" ? element.fill : undefined, color: element.type === "text" ? element.color : undefined, fontSize: element.type === "text" ? element.fontSize : undefined, fontWeight: element.type === "text" ? element.fontWeight : undefined, textAlign: element.type === "text" ? element.align : undefined }} onPointerDown={(event) => { event.stopPropagation(); beginDrag(event, element); }}>{element.type === "text" ? element.text : element.type === "image" ? <img src={element.src} alt={element.alt} draggable={false} style={{ objectFit: element.fit }} /> : null}</div>)}</div></div></section>
        <aside className="rightPanel">
          <section className="generatePanel"><div className="panelHeading"><h2>Generate image</h2><span className={falReady ? "readyDot" : "offDot"}>{falReady ? "Key ready" : "Key missing"}</span></div><textarea value={prompt} rows={5} placeholder="Describe the visible subject, setting, light, framing, and any plain open area. Ask for no lettering or logos." onChange={(event) => setPrompt(event.target.value)} /><button className="button generateButton" type="button" disabled={generating || !falReady || !prompt.trim()} onClick={generate}>{generating ? "Generating…" : "Generate with fal"}</button>{message ? <p className="errorMessage">{message}</p> : null}{!falReady ? <p className="setupHint">Add <code>FAL_KEY</code> to <code>.env.local</code>, then restart.</p> : null}</section>
          <section className="inspector"><h2>{selected ? `${selected.type[0].toUpperCase()}${selected.type.slice(1)} layer` : "Canvas"}</h2>{selected ? <><div className="layerOrder"><button className="smallButton" type="button" onClick={() => moveSelected(1)}>Bring forward</button><button className="smallButton" type="button" onClick={() => moveSelected(-1)}>Send backward</button></div><div className="fieldGrid compact"><NumberField label="X" value={selected.x} onChange={(x) => updateSelected({ x })}/><NumberField label="Y" value={selected.y} onChange={(y) => updateSelected({ y })}/><NumberField label="Width" value={selected.width} min={1} onChange={(width) => updateSelected({ width })}/><NumberField label="Height" value={selected.height} min={1} onChange={(height) => updateSelected({ height })}/></div>{selected.type === "text" ? <><label>Text<textarea value={selected.text} rows={5} onChange={(event) => updateSelected({ text: event.target.value })}/></label><div className="fieldGrid compact"><label>Color<input type="color" value={selected.color} onChange={(event) => updateSelected({ color: event.target.value })}/></label><NumberField label="Font size" value={selected.fontSize} min={8} onChange={(fontSize) => updateSelected({ fontSize })}/></div></> : selected.type === "shape" ? <label>Fill<input type="color" value={selected.fill} onChange={(event) => updateSelected({ fill: event.target.value })}/></label> : <label>Fit<select value={selected.fit} onChange={(event) => updateSelected({ fit: event.target.value })}><option value="cover">Fill frame</option><option value="contain">Fit inside</option></select></label>}<button className="button dangerButton" type="button" onClick={() => { mutate((current) => ({ ...current, elements: current.elements.filter((element) => element.id !== selected.id) }), true); setSelectedId(null); }}>Delete layer</button></> : <label>Background<input type="color" value={design.background} onChange={(event) => mutate((current) => ({ ...current, background: event.target.value }))}/></label>}</section>
        </aside>
      </div>
    </main>
  );
}

function NumberField({ label, value, min, onChange }: { label: string; value: number; min?: number; onChange: (value: number) => void }) {
  return <label>{label}<input type="number" min={min} value={Math.round(value)} onChange={(event) => onChange(Number(event.target.value))}/></label>;
}
