# Demo script (5–10 minutes)

A suggested running order for the walkthrough video. Start with `docker compose up --build`
already running so both services are up.

**1. Frame the problem (30s).** One sentence: a platform to manage feature flags across
environments, evaluate them per user with consistent rollouts, and audit every change.
Show the architecture diagram in the README.

**2. Sign in and the dashboard (1 min).** Log in as `admin@ff.local`. Walk the flags
list: keys in monospace, environment tags, status pills, and the rollout meter on
`new-checkout` in PROD. Switch the DEV/PROD filter.

**3. Create a flag with the AI assistant (2 min).** Click *New flag*. In the rule
assistant, type *"enable for 25% of users in Harare except internal staff"* and click
*Propose rule*. Show the structured proposal **and** the raw output. Note the provider
line (heuristic if no key, otherwise the LLM). Click *Show raw output* to make the point
that nothing is hidden. Click *Apply to form* — stress that this only fills the form; it
saves nothing until you do. Give it a key, save.

**4. Evaluation playground (2 min).** Go to *Playground*, evaluate `new-checkout` / PROD
for a user in Harare — show `enabled` / `reason` / `bucket`. Change the user id and show a
different bucket; re-run the same id and show it's stable. Toggle *Internal user* on and
show `EXCLUDED_INTERNAL`. Change the city and show `CITY_NOT_INCLUDED`. This is the
deterministic evaluation logic in action.

**5. Optimistic locking (1 min).** Open the same flag in two tabs. Save an edit in tab A,
then try to save in tab B — show the `409` conflict banner asking you to reload rather
than silently overwriting.

**6. Audit trail (1 min).** Open *Audit*. Expand a record to show the before/after diff.
Point out it's append-only.

**7. Role enforcement + API (1 min).** Sign out, sign in as `viewer@ff.local`. Show that
create/edit are gone and writes are refused. Finish on Swagger at `/api/docs`, and mention
the test suite: evaluation logic, optimistic locking, and the AI-mocked test.

**8. Close (30s).** Name one trade-off you'd revisit (e.g. scoped SDK keys for
server-side evaluation) to show you know where the edges are.
