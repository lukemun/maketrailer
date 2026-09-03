# Production-parity roadmap

## Landed baseline

- standalone local Next.js application
- atomic filesystem design storage
- local image uploads and BYO fal.ai generation
- PNG export
- stdio MCP server and portable creative skills
- clean build, storage smoke test, and MCP smoke test

## Extraction sequence

### 1. Shared workspace contracts

- versioned projects, assets, and designs
- legacy flat-design migration into a default project
- project and asset APIs
- matching MCP tools
- portable project bundle import/export

### 2. Production canvas core

- document hydration and operations
- renderer and text-edit overlay
- selection, resize, rotate, crop, draw, erase, and snapping
- keyboard controls, zoom, undo/redo, and autosave
- pages, rows, and variations
- production export pipeline

### 3. Editor surfaces

- layers, elements, templates, fonts, effects, positioning, and page controls
- reusable asset picker
- image and playback-only video pages
- responsive and accessible interaction states

### 4. Local creative services

- provider-neutral generation ports
- BYO image and video provider adapters
- background removal, upscale, and decomposition where locally supportable
- saved generation setup and provenance

### 5. Agent parity

- atomic `apply_edits`
- `list_elements` and `check_layout`
- page and variation tools
- asset import and generation tools
- preview, render, and export tools
- concurrency/version receipts for every mutation

### 6. Publication

- clean-checkout install and browser tests
- dependency and asset-license audit
- final AGPL and trademark review
- screenshots and a short local/MCP walkthrough
- public visibility, branch protection, secret scanning, and release automation

