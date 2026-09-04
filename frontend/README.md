# ObliTrack frontend

React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui, with React Router,
TanStack Query, and a fully-typed API client generated from the backend's
OpenAPI schema (`src/lib/api-schema.ts` — see below to regenerate it).

## Regenerating the typed API client

`src/lib/api-schema.ts` is generated, not hand-written. Whenever the
backend's API surface changes, regenerate it against a running backend:

```bash
# from backend/, with the venv active and a migrated database
uvicorn app.main:app --port 8000

# from frontend/, in another terminal
npx openapi-typescript http://localhost:8000/openapi.json -o src/lib/api-schema.ts
```

`openapi-typescript` isn't a project dependency (its TypeScript peer range
lags behind the version this project uses) — running it via `npx` avoids
that conflict without pinning an unresolvable devDependency. The generated
file is committed so the app builds without a live backend.

See the root [README](../README.md) for setup commands and
[`docs/ENGINEERING_WALKTHROUGH.md`](../docs/ENGINEERING_WALKTHROUGH.md) for
the full engineering build log.
