"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HelpDialog } from "./HelpDialog";
import type { Asset, Design, Project } from "@/lib/schema";

export function DesignLibrary() {
  const router = useRouter();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState("local");
  const [designs, setDesigns] = useState<Design[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [name, setName] = useState("Launch offer");
  const [projectName, setProjectName] = useState("");
  const [preset, setPreset] = useState("instagram-square");
  const [template, setTemplate] = useState("bold-offer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refreshWorkspace(projectId: string) {
    const query = `?projectId=${encodeURIComponent(projectId)}`;
    const [designData, assetData] = await Promise.all([
      fetch(`/api/designs${query}`, { cache: "no-store" }).then((response) => response.json()),
      fetch(`/api/assets${query}`, { cache: "no-store" }).then((response) => response.json()),
    ]);
    setDesigns(designData.designs || []);
    setAssets(assetData.assets || []);
  }

  useEffect(() => {
    void fetch("/api/projects", { cache: "no-store" }).then((response) => response.json()).then((data) => {
      setProjects(data.projects || []);
      const selected = data.projects?.some((project: Project) => project.id === activeProjectId)
        ? activeProjectId
        : data.projects?.[0]?.id;
      if (selected) setActiveProjectId(selected);
    });
  }, []);

  useEffect(() => { void refreshWorkspace(activeProjectId); }, [activeProjectId]);

  async function create() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/designs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, projectId: activeProjectId, preset, template }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create design");
      router.push(`/designs/${data.design.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create design"); }
    finally { setBusy(false); }
  }

  async function addProject() {
    if (!projectName.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/projects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: projectName }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create project");
      setProjects((current) => [data.project, ...current]);
      setProjectName("");
      setActiveProjectId(data.project.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create project"); }
    finally { setBusy(false); }
  }

  async function uploadAsset(file: File) {
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.set("file", file); form.set("projectId", activeProjectId);
      const response = await fetch("/api/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not upload asset");
      setAssets((current) => [data.asset, ...current]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not upload asset"); }
    finally { setBusy(false); if (uploadRef.current) uploadRef.current.value = ""; }
  }

  const activeProject = projects.find((project) => project.id === activeProjectId);

  return (
    <main className="libraryPage">
      <header className="siteHeader"><a className="brand" href="/">MakeTrailer<span>•</span> OS</a><div className="localBadge">Local-first</div></header>
      <section className="projectBar"><label>Project<select value={activeProjectId} onChange={(event) => setActiveProjectId(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><div className="newProject"><input aria-label="New project name" value={projectName} placeholder="New project name" onChange={(event) => setProjectName(event.target.value)} /><button className="button secondaryButton" type="button" disabled={busy || !projectName.trim()} onClick={addProject}>Add project</button></div></section>
      <section className="hero">
        <div><p className="eyebrow">Open source creative tooling</p><div className="headingRow"><h1>An ad canvas your AI agent can operate.</h1><HelpDialog title="How MakeTrailer OS works"><p>Your projects, designs, and reusable assets stay in a local folder on this computer. There is no account or cloud database.</p><p>Choose a project and starting layout, edit the layers, then export a PNG. Add your own fal.ai key to generate images. Connect the local MCP server to let an AI client work in the same projects.</p></HelpDialog></div><p className="heroCopy">Create in {activeProject?.name || "your local project"}, reuse its assets, and hand the same workspace to any MCP-capable agent.</p></div>
        <div className="createCard"><h2>Start a design</h2><label>Design name<input value={name} onChange={(event) => setName(event.target.value)} /></label><div className="fieldGrid"><label>Format<select value={preset} onChange={(event) => setPreset(event.target.value)}><option value="instagram-square">Instagram square</option><option value="instagram-story">Story / Reel</option><option value="facebook-feed">Facebook feed</option><option value="linkedin-feed">LinkedIn feed</option></select></label><label>Starting layout<select value={template} onChange={(event) => setTemplate(event.target.value)}><option value="bold-offer">Bold offer</option><option value="testimonial">Testimonial</option><option value="blank">Blank</option></select></label></div>{error ? <p className="errorMessage">{error}</p> : null}<button className="button primaryButton" type="button" disabled={busy || !name.trim()} onClick={create}>{busy ? "Working…" : "Create design"}</button></div>
      </section>
      <section className="designSection"><h2>Designs</h2>{designs.length ? <div className="designGrid">{designs.map((design) => <a className="designCard" href={`/designs/${design.id}`} key={design.id}><div className="miniCanvas" style={{ background: design.background, aspectRatio: `${design.width}/${design.height}` }}><span>{design.elements.length} layers</span></div><strong>{design.name}</strong><small>{design.width} × {design.height}</small></a>)}</div> : <div className="emptyState"><strong>No designs in this project yet.</strong><span>Create one above to establish the project canvas.</span></div>}</section>
      <section className="designSection assetSection"><div className="sectionHeading"><div><h2>Assets</h2><p>Reusable media saved once and available to this project.</p></div><button className="button secondaryButton" type="button" disabled={busy} onClick={() => uploadRef.current?.click()}>Upload image</button><input ref={uploadRef} hidden type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && void uploadAsset(event.target.files[0])} /></div>{assets.length ? <div className="assetGrid">{assets.map((asset) => <article className="assetCard" key={asset.id}><img src={asset.src} alt={asset.filename} /><strong>{asset.filename}</strong><small>{asset.favorite ? "★ Favorite" : asset.kind}</small></article>)}</div> : <div className="emptyState"><strong>No reusable assets yet.</strong><span>Upload an image here or generate one inside a design.</span></div>}</section>
    </main>
  );
}
