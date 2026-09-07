# MakeTrailer

An open-source, AI-native creative studio for ads, design, images, and video—built for people and agents.

MakeTrailer saves projects, designs, and reusable assets on your computer, generates images with your own fal.ai key, exports full-resolution PNGs, and exposes the same workspace through a local MCP server. It has no account, Supabase, tracking, managed credit, or MakeTrailer Cloud requirement.

> Status: early extraction. The local projects, assets, design, persistence, generation, export, and MCP foundations are implemented. The full production MakeTrailer canvas is now being moved here; the current editor is temporary and does not yet represent production parity. See [the roadmap](docs/roadmap.md).

## What you get

- Instagram, Story/Reel, Facebook, and LinkedIn canvas presets
- blank, bold-offer, and testimonial starting layouts
- editable text, image, and shape layers
- direct canvas positioning plus an exact-value inspector
- local image uploads
- server-side BYO fal.ai generation using Flux Schnell
- full-resolution PNG export
- local projects and a reusable asset library
- atomic local JSON persistence and a local media folder
- stdio MCP tools, resources, and an ad-design prompt
- portable image-prompt and visual-composition skills

## Requirements

- Node.js 20.9 or newer
- pnpm 10 or newer
- optional: a [fal.ai](https://fal.ai/) API key for image generation

## Set up

```bash
git clone https://github.com/lukemun/maketrailer.git
cd maketrailer
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

You can create, edit, save, reload, upload, and export without any provider key.

### Enable image generation

Edit `.env.local`:

```dotenv
FAL_KEY=your_fal_key
```

Restart the development server. The key is read only by the local server. It is never returned to browser code or stored in a design.

`FAL_API_KEY` is accepted as an alternative for compatibility with existing setups.

## Where your work is saved

By default, data lives in:

```text
.maketrailer/
├── projects/  # local workspaces
├── designs/   # editable JSON documents
├── assets/    # reusable media metadata
└── media/     # uploads and downloaded generations
```

Set `MAKETRAILER_DATA_DIR` to an absolute path to store it elsewhere. Back up that directory to back up all MakeTrailer work.

## Connect MCP locally

First install dependencies. Then add this stdio server to your MCP client, replacing the path with the absolute path on your computer:

```json
{
  "mcpServers": {
    "maketrailer": {
      "command": "pnpm",
      "args": ["--dir", "/absolute/path/to/maketrailer", "--silent", "mcp"],
      "env": {
        "MAKETRAILER_DATA_DIR": "/absolute/path/to/maketrailer/.maketrailer"
      }
    }
  }
}
```

If your MCP client does not run the command from the package directory, the `--dir` argument is important. Put `FAL_KEY` in `.env.local` in that directory; do not paste it into a prompt.

Available tools currently include:

- `list_projects`
- `get_project`
- `create_project`
- `update_project`
- `list_assets`
- `get_asset`
- `update_asset`

- `list_designs`
- `get_design`
- `create_design`
- `update_design`
- `add_element`
- `update_element`
- `delete_element`
- `generate_image`
- `list_creative_skills`

The server also exposes both bundled skills as MCP resources and provides a `make_ad_design` MCP prompt. Logs go to stderr so stdout stays valid MCP.

## Use the bundled skills directly

Agent clients that support portable skills can load:

- `skills/ad-image-prompt-writing/SKILL.md`
- `skills/ad-visual-composition/SKILL.md`

They intentionally keep generated imagery separate from editable marketing copy and teach agents to preserve a fast ad-reading hierarchy.

## Verify your installation

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

The smoke check uses a temporary data directory and proves create → save → reload without touching your work.

## Security model

- The web server binds to `127.0.0.1` by default.
- Provider credentials stay server-side.
- Designs contain local media URLs, never credentials.
- Uploads and provider downloads are limited to supported images and 20 MB.
- Media and design identifiers are path-safe.
- JSON saves use write-then-rename atomic replacement.

This is local software, not a security boundary against other processes with access to your user account. See [SECURITY.md](SECURITY.md) for reporting.

## Open source versus MakeTrailer Cloud

This repository will contain the complete production canvas, local projects and assets, BYO generation, export, and MCP control. MakeTrailer Cloud may provide accounts, collaboration, managed generation and credits, hosted media, publishing, campaign and book workflows, organization controls, and support. Local MakeTrailer must not phone home or silently require those services.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Small, focused issues and pull requests are welcome. Please discuss file-format breaks or broad architecture changes before investing in them.

## License

MakeTrailer is licensed under AGPL-3.0-or-later. See [LICENSE](LICENSE). The MakeTrailer name and logos are not granted under that software license.
