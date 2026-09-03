# Security policy

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could expose credentials, overwrite files outside the data directory, execute arbitrary code, or compromise an MCP client.

Use GitHub's private vulnerability reporting for the public repository. Until that repository is published, contact the maintainer privately through the support address listed on the MakeTrailer website. Include the affected version, reproduction, impact, and any suggested mitigation. Do not include a real provider key or private design.

We aim to acknowledge a complete report within five business days. Timelines for a fix depend on severity and reproducibility.

## Supported versions

Before 1.0, only the latest commit and latest tagged release receive security fixes.

## Credential safety

Use `.env.local` for `FAL_KEY`. Never use a `NEXT_PUBLIC_` prefix, commit the file, paste the key into a prompt, or add it to an MCP tool argument. Rotate the key immediately if it appears in logs, issues, screenshots, or design JSON.
