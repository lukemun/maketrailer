# MakeTrailer architecture

## Product boundary

This public repository is the upstream, local-first implementation of MakeTrailer's
creative workspace. It owns the complete design-canvas experience and the
portable data contracts around it:

- projects
- reusable image and video assets
- multi-page designs and variations
- the production canvas editor
- local provider adapters
- local import, export, and MCP control

It deliberately does not contain the timeline editor, accounts, billing,
hosted collaboration, publishing, analytics, book workflows, Stage, or managed
campaign operations.

## Repository boundary

The public `maketrailer` repository is the only source of truth for the canvas,
portable document contracts, local projects and assets, provider ports, export,
and MCP control. Canvas behavior is never copied into a second application.

The private `maketrailer-cloud` repository consumes this upstream through
host adapters for authentication, Supabase persistence, billing, managed
generation, collaboration, publishing, and private product workflows. The
private `reason-and-reach` repository owns client inputs and outputs, campaign
deliverables, prospecting, and agency operations; reusable product capability
does not live there.

## Upstream rule

The open repository is not a simplified reimplementation of the hosted
editor. The production canvas is extracted here and the hosted MakeTrailer
application consumes it through adapters. A canvas capability is complete only
when the same editor implementation works against both the local adapters and
the hosted adapters.

## Dependency direction

```text
app shell / MCP
       |
       v
projects + assets + designs contracts
       |
       v
production canvas package
       |
       v
ports: persistence, media, generation, export, telemetry
       |
       +-- local filesystem / BYO provider
       +-- hosted MakeTrailer adapters (private repository)
```

The canvas may depend on contracts and ports. It must not import Supabase,
billing, account state, hosted API routes, or MakeTrailer-only agent surfaces.

## Local data layout

`MAKETRAILER_DATA_DIR` defaults to `.maketrailer/` and contains versioned,
portable records:

```text
.maketrailer/
  projects/*.json
  designs/*.json
  assets/*.json
  media/*
```

Media bytes are stored once. Designs refer to asset identifiers and local media
URLs; projects organize assets and designs without owning duplicate files.
Writes use atomic replacement. Readers migrate older documents before exposing
them to the application.

## MCP parity

The web app and local stdio MCP server call the same domain modules. MCP must
cover the complete agent loop: inspect projects and assets, inspect a design,
apply an atomic edit batch, check layout, manage pages and variations, generate
or import media, render a preview, and export a portable result.

## Extraction gates

1. Freeze production canvas fixtures and behavior tests.
2. Move pure document, rendering, interaction, history, and export code first.
3. Replace hosted imports with explicit ports.
4. Run the same fixtures against the local and hosted adapters.
5. Remove the temporary miniature editor only after the production editor
   passes the local clean-install and browser interaction suite.
