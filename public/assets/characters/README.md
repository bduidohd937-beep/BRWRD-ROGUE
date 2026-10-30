# BTWRD: ROGUE character assets (V0.2)

Place the two **approved, alpha-transparent** files in this directory:

- `irang.webp` — 이랑
- `belcaris.webp` — 벨카리스

Both files are normalized to **640 × 960 RGBA WebP**. Original accepted character paintings are preserved separately, not regenerated.

The React interface references:
- `/assets/characters/irang.webp`
- `/assets/characters/belcaris.webp`

**Important:** Binary assets are not yet committed via the GitHub connector. Obtain the asset bundle attached to the conversation, unzip its `public/assets/characters` directory into this repository, then commit those two .webp files. Until they are present, the UI safely falls back to the original emoji.

아르시온: reference sheet only, awaiting an approved standalone full-body asset.

The CSS anchors sprites to the bottom of the arena and uses a subtle idle motion. This is **not** a pixel-art conversion nor a frame-based animation. Validate on PC and mobile before merging.
