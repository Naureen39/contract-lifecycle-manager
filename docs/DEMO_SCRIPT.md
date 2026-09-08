# ObliTrack demo script

A ~10-minute walkthrough of the product, in the order it tells the best
story. Two paths are covered:

- **Path A — seeded data** (recommended, works with zero external
  credentials): shows the compliance calendar, review queue, and alerting
  fully populated, using the synthetic obligation calendar seeded from the
  real CUAD v1 contract dataset.
- **Path B — live extraction**: uploads a real contract and watches it go
  through the actual LLM extraction pipeline. Requires a real `GROQ_API_KEY`
  or `GEMINI_API_KEY` in `.env` (see the root README) — without one, the
  upload still succeeds but extraction stays queued rather than completing
  live, which is itself worth showing (the system degrades gracefully
  instead of failing the upload).

Run Path A first regardless — it's what makes the rest of the app look like
a live, multi-month system rather than an empty database.

## Setup

```bash
# from backend/, with the venv active and the database migrated
python -m scripts.seed_demo_data --demo
```

This prints three login accounts, all sharing one password. Use the admin
account for the full walkthrough:

```
admin@demo.oblitrack.example   (admin)
counsel@demo.oblitrack.example (legal_ops)
viewer@demo.oblitrack.example  (viewer)
password: ObliTrackDemo!2026
```

Start the stack (`docker compose -f infra/docker-compose.yml up`, or the
backend/frontend separately per the README) and open the frontend. The
first thing shown is the public landing page, not the login form —
worth a few seconds pointing out before the walkthrough proper starts,
since it's the only part of the product a prospective user sees before
creating an account. Click "Log in" from there (or go straight to
`/login`) to continue.

## Path A — seeded data walkthrough

1. **Log in** as `admin@demo.oblitrack.example`. Land on the **Dashboard** —
   point out the at-risk/overdue/upcoming-this-month counts and the total
   active contract value are real aggregate queries, not placeholders.
2. **Contracts** — a list of real historical contracts (SEC EDGAR filings,
   via CUAD), with status pills. Open one to show the contract detail page:
   metadata, the inline PDF/DOCX-derived preview, and the obligations
   extracted from it with their source traceability.
3. **Review Queue** — every obligation flagged for human review (either
   low LLM confidence, or a high-stakes category like renewal/termination
   notice — the system never silently auto-trusts those). Confirm one,
   edit one (change its trigger date and watch its status recompute), waive
   one. Point out the audit log entry each action leaves.
4. **Compliance Calendar** — everything due soon or already overdue, across
   every contract, sorted chronologically. Switch the time window (30/60/90
   days) to show it re-queries live.
5. **Precedent Search** — search for a real clause concept (e.g. "90 day
   termination notice", "limitation of liability cap"). Results are ranked
   by real embedding cosine similarity against every contract paragraph
   ever ingested, each linking back to its source contract.
6. **Admin → LLM Usage** — today's Groq/Gemini quota consumption (0 so far,
   since Path A never called a real LLM). Click **Run alert scan now** —
   this is the same job the `worker` process runs daily on a cron schedule,
   triggered on demand. It recomputes every obligation's status from
   today's date and sends alerts for anything newly at-risk or overdue.
7. **Admin → Audit Log** — the full trail of everything just done: logins,
   the obligation edit/confirm/waive actions, the alert scan.

## Path B — live extraction (optional, needs a real LLM key)

1. Set `GROQ_API_KEY` (or `GEMINI_API_KEY`) in `.env` and restart the
   backend.
2. **Contracts → Upload contract** — drag in a real PDF or DOCX. The
   response is immediate; watch the status pill go
   `processing → needs_review` (or `active`, if every extracted obligation
   was high-confidence) as the extraction job runs synchronously in the
   background of that same request.
3. Open the contract — the extracted obligations are there, each traceable
   to its exact source paragraph (`raw_source_text`), with the LLM's own
   confidence score.
4. Re-upload the *same* file (or a near-duplicate contract) — because the
   clause is now cached in `clause_precedent_cache`, this second extraction
   reuses the cached result instead of calling the LLM again. Visible on
   **Admin → LLM Usage**: the request/token counters don't move.

## Alert emails

Alerts are recorded either way; whether an email actually lands depends on
`SMTP_HOST` in `.env`. For a demo, point it at a local SMTP catcher (e.g.
[Mailpit](https://github.com/axllent/mailpit) or
[MailHog](https://github.com/mailhog/MailHog)) rather than a real mail
server, then open its web UI after **Run alert scan now** to show the
actual rendered email (plain text + HTML). Without `SMTP_HOST` configured,
alerts are still recorded with `status=failed` and a clear error — shown,
not hidden, which is itself a legitimate point to make about the system's
failure handling (one bad send never blocks the rest of the batch).
