# Unified login and data migration

DistroNow is now the main application and the only authentication owner.

## Login model

- DistroNow uses Supabase magic-link authentication.
- Every project is owned by the authenticated Supabase user, or temporarily by
  the anonymous browser owner before claiming.
- AClienti, accman, AutoArt, Streamwin, MassCall, ClipRO, and Reclip did not
  have independent account systems; their prototypes used browser-local state,
  mocked state, or local files.
- They no longer need separate login screens. Their records belong under the
  authenticated DistroNow project.

## Shared data model

The `module_records` table stores the first unified import boundary:

```text
project → module → record type → external id → payload
```

This keeps each module’s category and record shape visible while giving the
Marketing OS one ownership, deletion, export, and audit boundary.

The migration page is available at:

```text
/projects/[id]/modules/migration
```

Use **Import all source records** after applying the
`20260822133000_create_module_records.sql` migration. The import is idempotent
for the included source IDs.

## What is imported in the first pass

- AClienti: research lens, public signals, qualification scores, and content
  briefs;
- accman: accounts, niches, formats, trends, plans, prompts, and creative
  research records;
- ClipRO + Reclip: source records, ranked clips, and source
  preparation/download workflow;
- AutoArt, Streamwin, and MassCall remain separate companion apps and are not
  imported into the core DistroNow project records.

This is the persistent migration boundary, not the final provider integration.
OAuth connections, workers, media storage, third-party APIs, and platform
publishing still need to be wired to these project-owned records.
