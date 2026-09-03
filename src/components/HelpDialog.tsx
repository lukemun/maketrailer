"use client";

import { useState } from "react";

export function HelpDialog({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="helpButton" type="button" aria-label={`Help: ${title}`} onClick={() => setOpen(true)}>?</button>
      {open ? (
        <div className="modalBackdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="helpDialog" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialogHeader"><h2 id="help-title">{title}</h2><button className="iconButton" type="button" aria-label="Close help" onClick={() => setOpen(false)}>×</button></div>
            <div className="helpContent">{children}</div>
            <button className="button secondaryButton" type="button" onClick={() => setOpen(false)}>Done</button>
          </section>
        </div>
      ) : null}
    </>
  );
}
