# Forekast Project Plan

## Product objective

Forekast should help people publish testable predictions, discuss them, return
when outcomes are known, and build an accuracy record. The immediate objective
is not broad growth. It is to prove that a small group can understand and
complete this loop reliably:

**Register → create a prediction → interact with another prediction → resolve
an outcome → return later**

## First-beta outcome

Run a controlled beta with 10–15 testers and collect enough evidence to decide
what to fix before adding a major feature.

### Success targets

| Measure | First-beta target | Source |
|---|---:|---|
| Invited testers | 10–15 | Tester roster |
| Successful registrations | At least 8 | `users` |
| Users creating a prediction | At least 5 | `prediction_created` |
| Returning users | At least 3 | Activity on 2+ distinct days |
| Total predictions | At least 15 | `tweets` |
| Unresolved critical bugs | Fewer than 3 | Issue board |

Targets are planning goals, not public claims. Only actual measured results
belong in a portfolio or resume.

## Scope

### Required before invitations

- Complete one short visual-consistency pass on the feed and profile.
- Verify registration, login persistence, prediction creation, filtering,
  comments, resolution, deletion, following, signals, and reposts.
- Verify friendly loading, empty, validation, authentication, and server-error
  states on desktop and mobile.
- Apply all production database migrations and verify `/api/health`.
- Add enough seed predictions that a new account can browse and interact.
- Provide one obvious feedback channel.
- Prepare a concise privacy/data-use notice.
- Confirm that production errors are observable.
- Complete the beta test script and issue board.

### Deliberately deferred

- A full X/Twitter clone or pixel-for-pixel redesign
- Direct messages, media uploads for predictions, or real-time chat
- Public leaderboards before scoring and moderation are validated
- Recommendation algorithms before there is enough real activity
- Microservices, event streaming, or a separate analytics warehouse
- Native mobile applications

## Workstreams

### 1. Reliability

Test the complete workflow with a fresh account, an expired or invalid token,
invalid form data, a temporarily unavailable API, and a narrow mobile viewport.
Every critical workflow needs a successful path, a useful failure message, and
a repeatable verification step.

### 2. Product experience

Borrow proven social-feed structure without copying X/Twitter's product
density. Forekast's distinctive information must remain visually prominent:

- Prediction statement
- Target date
- Open/resolved state
- Correct, incorrect, or inconclusive result
- Reasoning and resolution evidence
- Forecaster accuracy

The visual pass is complete when testers can identify the primary action and
scan a prediction without instruction. It is not blocked on visual perfection.

### 3. Measurement

Use PostgreSQL as the source of truth for accounts and product actions.
Backend events cover signup, login, prediction creation and views, comments,
resolution, and feed-filter use. Do not place email addresses, prediction text,
passwords, or tokens in analytics.

The first funnel is:

**Visited → registered → created → interacted/resolved → returned**

Traffic/page-view measurement may be added through a hosted analytics product,
but it must remain separate from registered-user and active-user counts.

### 4. Beta research

Recruit from classmates, residence-life colleagues, scholarship networks,
friends interested in forecasting topics, and relevant UBC clubs.

Give every tester the same core tasks:

1. Create an account.
2. Find or create a prediction.
3. Comment on another person's prediction.
4. Resolve one if its target date permits.
5. Report the first confusing or broken moment.

Observe 3–5 sessions without immediately helping. Ask afterward:

1. What did you think Forekast was for?
2. Where did you hesitate?
3. Which action felt most useful?
4. What would make you return?
5. What broke or behaved unexpectedly?

### 5. Engineering depth

After the first beta, implement one deeper feature driven by observed need.
The default choice is cursor pagination plus indexed search/filtering and
documented query measurements. If return behavior is the larger problem,
scheduled reminders or notifications may replace it.

## Prioritization

Address findings in this order:

1. Security, privacy, authentication, or data-loss defects
2. Critical actions that cannot be completed
3. Confusing onboarding and unclear product purpose
4. Mobile usability and accessibility
5. Slow or unreliable behavior
6. Frequently requested improvements
7. Cosmetic preferences

For every issue, record:

| Field | Meaning |
|---|---|
| Issue | Observable problem, not a proposed solution |
| Severity | Critical, high, medium, or low |
| Affected testers | Number who encountered or reported it |
| Evidence | Session note, error, screenshot, or metric |
| Effort | Small, medium, or large |
| Status | New, planned, in progress, validating, or done |

## Definition of done

A change is done when:

- The intended user workflow succeeds.
- Failure and empty states are understandable.
- Authorization and validation still hold.
- Relevant tests pass with `npm run validate`.
- Schema changes include a migration.
- Analytics are added only when they answer a defined product question.
- Documentation changes when setup, behavior, or architecture changes.
- The change is verified at mobile and desktop widths when it affects UI.

## Operating cadence

- Keep one weekly outcome, not a large collection of parallel features.
- Review beta evidence and issue severity before choosing the next item.
- Run the complete validation command before merging or deploying.
- Review beta metrics once per week; avoid reacting to daily noise.
- Maintain a short decision log in pull requests or issue descriptions.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Polishing indefinitely before testing | Time-box the initial visual pass to two days |
| Empty feed makes the product feel inactive | Seed varied, resolvable predictions |
| Friends give polite but vague feedback | Give concrete tasks and observe behavior |
| Analytics overstate usage | Keep visitors, accounts, and active users separate |
| A feature suggestion dominates priorities | Weight by severity and affected testers |
| Resolution changes counts inconsistently | Keep resolution and event writes transactional |
| Scope expands into a Twitter clone | Judge work against the forecasting loop |

