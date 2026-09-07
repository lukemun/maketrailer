# Production canvas extraction map

Source snapshot inspected: MakeTrailer production repository, 2026-09-03.

## Size

- 348 TypeScript and TSX files in the editor tree
- approximately 67,900 runtime lines
- approximately 13,900 test lines

The largest runtime areas are the view layer (~21,800 lines), renderer
(~16,300), templates (~10,200), model (~5,400), and actions (~4,600).

## What moves unchanged in principle

- document model and hydration
- pure document operations
- scene drawing and text layout
- selection and direct-manipulation tools
- snapping and layout checks
- local undo/redo history
- canvas store
- export planning and rasterization
- templates and canvas presets whose assets are redistributable

## Couplings that must become ports

The first model-only extraction proved that the current boundary is not yet
pure. Model files reach through shared types into production-only systems.
These imports must be inverted before moving the editor:

| Current dependency | Open-source port |
| --- | --- |
| Supabase client and revisions | `DesignPersistence` |
| hosted asset routes and signing | `AssetRepository` |
| billing and tier limits | optional `CapabilityPolicy` |
| generation jobs and fal model registry | `GenerationProvider` |
| Still Studio launch contracts | `ImageGenerationDraft` contract |
| hosted video form/review state | `VideoGenerationDraft` contract |
| user font APIs | `FontRepository` |
| observability reporter | `Telemetry` with a no-op local adapter |
| Support widget and dashboard shell | host-owned slots, absent locally |
| Spek/live-outline stores and events | optional host integration |

The local app implements these ports with the filesystem, browser APIs, and
BYO provider keys. Hosted MakeTrailer keeps its existing behavior in private
adapters.

## Extraction order

1. Split the editor document types away from launch/generation UI types.
2. Extract model, operations, layout check, history, and store with frozen
   production fixtures.
3. Extract renderer and interaction tools.
4. Extract export behind an asset-byte resolver.
5. Extract view and action layers one dependency group at a time.
6. Move templates only after their fonts, images, and licensing receipts are
   included.
7. Replace the temporary local editor after the extracted editor passes the
   same interaction fixtures in both applications.

## Parity rule

No behavior should be reimplemented specifically for local MakeTrailer when the
production implementation can be made host-neutral. During the transition,
the temporary local editor stays usable, but it is not the parity target.
