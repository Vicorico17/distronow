# Local content migration record

The local directory `/Users/vicorico/content` was reviewed before cleanup.
The useful product and strategy information is now represented in the DistroNow
project through:

- `src/lib/content-library.ts` — reusable strategy, hook, format, UGC,
  character, slideshow, niche, lead-magnet, publishing, and operating
  playbooks;
- `src/lib/marketing-blueprint.ts` — the complete product model and source
  migration map;
- `/projects/[id]/content-library` — readable playbooks;
- `/projects/[id]/blueprint` — the full product review and implementation map;
- `PRODUCT_ARCHITECTURE.md` — durable architecture decisions;
- `IMPLEMENTATION_TODO.md` — remaining implementation work.

## Source mapping

| Local source | Migrated into DistroNow |
| --- | --- |
| `ai-marketing-os` | unified product model, dashboard ideas, creation/distribution modules, ClipRO, voice outreach, UGC, characters, slideshows, lead magnets, niches |
| `script generation` | hook/angle/format libraries, content mix, idea scoring, analytics and fatigue concepts |
| `emailing-leadmagnet` | comment-to-email funnel and nurture workflow |
| `character generation` | character bible, voice, contradiction, visual anchors, consistency rules |
| `slideshows` and Obsidian slideshow notes | carousel audit framework |
| `untapped niches` | niche scoring, validation, offers, risks, and research prompts |
| `clipping` | ClipRO ingest, transcription, SRT, FFmpeg, job, preview, and permission boundaries |
| `growth-agent-hub` | read-only integration contracts, least-privilege auth, redaction, rate limits, and failure handling |
| `postiz-app` | calendar-first provider architecture, scheduling, media, sets, analytics, APIs, webhooks, and team workflows; no source code copied |
| `virality` | question hooks, pattern interruption, scoring, share triggers, and safe testing |

`obsidian-releases` and unrelated Obsidian configuration files are not part of
the marketing product and were intentionally not imported.

## Cleanup boundary

Do not delete the original directory until this migration record and the two
in-app review pages have been checked. Postiz is AGPL-licensed source code and
should remain separate unless a deliberate license decision is made. The
original source directory can be removed after review if the source code itself
is no longer needed.
