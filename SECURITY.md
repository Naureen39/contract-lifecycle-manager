# Security Policy

ObliTrack is a proprietary project (see [`LICENSE`](LICENSE)) currently
in active development, not yet handling production customer data.

## Reporting a Vulnerability

If you find a security issue in this codebase, please report it privately
rather than opening a public GitHub issue — email
naureenmujtaba35@gmail.com with a description and, if possible, steps to
reproduce. Please allow a reasonable window to investigate and address the
issue before any public disclosure.

## Scope

This applies to the code in this repository (`backend/`, `frontend/`,
`infra/`) — not to third-party dependencies, which should be reported to
their own maintainers (and are automatically scanned here via `pip-audit`
and `npm audit` in CI on every push).

## What This Project Already Does

- Passwords are hashed with bcrypt, never stored or logged in plaintext.
- JWT access tokens are short-lived; refresh tokens rotate on use and are
  revocable via a denylist table.
- Every request is scoped to the authenticated user's organization at the
  database query level — enforced in code and covered by tests, not left
  to convention.
- Uploaded files are validated by magic bytes (not just filename/MIME
  type), size-limited, and stored under server-generated paths outside any
  web-served root.
- Auth endpoints are rate-limited; CORS is an explicit allow-list, never
  `*`.
- All secrets (JWT signing key, LLM API keys, SMTP credentials, DB URL)
  are loaded from environment variables — never committed, and startup
  fails fast if `ENVIRONMENT=production` is set with an insecure default.
