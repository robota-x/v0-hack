# Docs

This folder is split in two:

- **[`current.md`](./current.md)** — the actual app and API surface as it exists in the repo today. Source of truth for anyone touching the website, the database, or the boundary the workflow has to talk to.
- **[`planning/`](./planning/)** — the original design docs we wrote before any code existed. Architecture intent, pipeline shape, and reference notes for the third-party services we plan to integrate (BrightData, Vercel Workflows, Mubit).

If you're building the workflow, read `current.md` for the API contracts you have to honor, and `planning/architecture.md` + `planning/vercel-workflows.md` for the shape of the pipeline you're about to write.

If you're touching the website, read `current.md`.

If something disagrees, `current.md` wins for what *is*, `planning/` wins for what *should be*.
