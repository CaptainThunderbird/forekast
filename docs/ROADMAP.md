# Forekast Development Roadmap

This roadmap starts July 29, 2026. Dates are targets; milestone exit criteria,
not calendar pressure, determine when Forekast advances.

## Milestone 0 — Beta-ready foundation

**Target:** July 29–August 2  
**Goal:** Make the existing loop credible and dependable enough to test.

### Deliverables

- Time-boxed feed and profile visual cleanup
- Responsive check at phone, tablet, and desktop widths
- Fresh-account end-to-end workflow check
- Seed content covering several categories and target dates
- Feedback link or form
- Short data-use notice
- Production error monitoring and verified health check
- Beta task script, tester roster, and issue board

### Exit criteria

- No known critical bug blocks registration, creation, commenting, or resolution.
- A new tester can identify the primary action without coaching.
- The deployed client and API pass smoke testing on desktop and mobile.
- Analytics events are visible for a controlled test account.
- `npm run validate` passes.

## Milestone 1 — Controlled beta 1

**Target:** August 3–9  
**Goal:** Learn where users fail or lose interest.

### Deliverables

- Invite 10–15 testers individually.
- Observe at least 3–5 sessions.
- Run the same core task sequence with each tester.
- Record issues, severity, affected-user count, and evidence.
- Capture registration, activation, return, content, and error metrics.

### Exit criteria

- At least 8 successful registrations are attempted as the planning target.
- The team can explain the largest drop-off in the activation funnel.
- The top three product problems are supported by behavior or repeated reports.
- Actual results are documented separately from targets.

## Milestone 2 — Activation and reliability iteration

**Target:** August 10–16  
**Goal:** Remove the highest-impact barriers found in beta 1.

### Deliverables

- Fix all security, data-loss, and authentication issues first.
- Fix blocked actions and repeated onboarding confusion.
- Improve mobile behavior and slow/error-prone paths.
- Add regression tests for repaired critical workflows.
- Re-run the beta task sequence with 3–5 testers.

### Exit criteria

- No unresolved critical issue remains.
- Previously blocked tasks succeed in verification sessions.
- The most common onboarding confusion is materially reduced.
- Error rate is stable or lower after deployment.

## Milestone 3 — One deeper engineering feature

**Target:** August 17–30  
**Goal:** Improve the product and create a strong technical case study.

### Default feature

Cursor pagination plus indexed search and filtering:

- Define stable cursor semantics and API response metadata.
- Add search/filter indexes based on measured query plans.
- Preserve active filters while loading more results.
- Add API contract and integration tests.
- Record query latency and query-plan changes before and after.
- Document design choices and tradeoffs.

### Decision gate

Replace the default feature with notifications or scheduled reminders only if
beta evidence shows that forgetting to return is a larger problem than finding
relevant predictions.

### Exit criteria

- The feature addresses a measured beta problem.
- Performance and correctness are measured, not assumed.
- The implementation is covered by tests and architecture documentation.

## Milestone 4 — Controlled beta 2

**Target:** August 31–September 13  
**Goal:** Test improvements with a broader and less familiar audience.

### Deliverables

- Recruit 20–30 testers, including people outside the immediate network.
- Repeat the core funnel and usability study.
- Compare cohorts on registration, activation, seven-day activity, return,
  predictions/comments per active user, and error rate.
- Identify the most-used and least-understood product capabilities.

### Exit criteria

- Before/after metrics and qualitative findings are documented.
- Forekast has a defensible answer to “what changed because of user evidence?”
- The next investment—retention, discovery, moderation, or pause—is explicit.

## Milestone 5 — Portfolio and sustainable operation

**Target:** September 14–20  
**Goal:** Turn completed work into credible evidence and make the app maintainable.

### Deliverables

- Architecture diagram and updated screenshots
- Concise case study: problem, users, evidence, decisions, outcome
- README setup and deployment verification
- CI for tests, lint, and production build
- Backup, monitoring, and incident notes
- Resume bullets using only measured outcomes

## Later candidates

These are not committed. Re-rank them after beta 2:

- Scheduled resolution reminders
- Notification center
- Moderation and reporting
- Email verification and password recovery
- Ranked feed with a documented scoring model
- Accessibility audit
- Public accuracy methodology
- Evidence-quality or calibration improvements

## Release gates

| Gate | Required evidence |
|---|---|
| Invite beta users | Core workflows pass; health and analytics verified |
| Add a major feature | First-beta problem and intended metric documented |
| Expand beta | Critical beta-1 issues fixed and regression-tested |
| Claim an outcome | Actual metric query and measurement period recorded |
| Public launch | Moderation, recovery, privacy, monitoring, and backups ready |

