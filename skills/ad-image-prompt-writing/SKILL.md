---
name: ad-image-prompt-writing
description: Write production-ready image-model prompts for editable social ads while keeping typography and claims out of generated pixels.
---

# Ad image prompt writing

Use this skill when an ad design needs generated visual material. Do not use it to generate the ad's final typography; copy should remain an editable text layer unless the user explicitly asks for text baked into the image.

## Build the prompt from the canvas need

Describe the image the layout needs, not the whole marketing strategy. Include the subject and action, environment and meaningful props, framing and camera distance, lighting/palette/texture/medium, any region that must remain a plain evenly lit surface, and crop intent. State only the visible target; do not explain what will be added there later.

Use concrete visual language. Replace adjectives like “premium” with visible evidence: controlled highlights, dark walnut, restrained styling, a large soft light source, shallow depth of field.

## Protect editability

- Ask for no lettering, logos, watermarks, UI, or illegible pseudo-text.
- Generate a background or hero visual; add headline, proof, offer, and CTA as canvas layers.
- Do not ask the model to reproduce an exact trademark or a living artist's signature style.
- When a product or person must remain exact, attach and explicitly bind a reference image if the model supports it. Otherwise state that fidelity is not guaranteed.

## Final prompt check

Confirm the prompt is intelligible by itself, every referenced image will actually be attached, the requested negative space matches the planned copy position, and no hidden project vocabulary leaked into model-facing prose.

Example: “Overhead editorial photograph of a ceramic pour-over coffee set on warm travertine, morning side light casting long soft shadows, tactile linen and one folded newspaper as restrained props, product grouped in the lower-right third, the upper-left half is an uncluttered evenly lit cream surface, natural warm neutrals with one burnt-orange accent, realistic commercial photography, no lettering, no logos, no watermark.”
