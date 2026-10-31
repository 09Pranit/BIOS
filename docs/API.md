# Smriva stage 2 API

Base URL: `http://localhost:3001/api`. Node 24, SQLite WAL, Zod validation. The normal offline screens and the online database console share one immutable operation log.

All routes except health, enrollment, and recovery require `Authorization: Bearer <device-token>`. Tokens are issued during enrollment and kept encrypted in the unlocked device workspace. API responses are not cached by the service worker.

## Authentication and administration

| Method | Route                          | Behavior                                                                                                                                                                            |
| ------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/health`                      | Service readiness, protocol, demo mode and implemented capabilities; never secrets                                                                                                  |
| POST   | `/enroll`                      | `{actor, role, code}`. In controlled mode, invitation determines the role; client role claims are ignored. First use of the bootstrap token enrolls the sole initial administrator. |
| POST   | `/recover`                     | `{recovery, actor}` atomically replaces a device and revokes the old identity                                                                                                       |
| GET    | `/session`                     | Current identity, role, school and expiration                                                                                                                                       |
| POST   | `/session/renew`               | Renew an authenticated non-expired online session for seven days                                                                                                                    |
| GET    | `/capabilities`                | Manual API, concurrency and protocol capabilities                                                                                                                                   |
| GET    | `/database`                    | Actual schema version, record counts and SQLite page storage                                                                                                                        |
| GET    | `/devices`                     | Real enrolled devices; internal signing writers are excluded                                                                                                                        |
| POST   | `/devices/:id/revoke`          | Role/school checked revocation; last administrator is protected                                                                                                                     |
| POST   | `/admin/invitations`           | Hub Admin only: `{role, ttlHours}`; returns one-time expiring code                                                                                                                  |
| GET    | `/admin/audit`                 | Reviewer/Admin: decrypted authorized audit events                                                                                                                                   |
| GET    | `/admin/quarantine`            | Reviewer/Admin: preserved operations with quarantine reasons                                                                                                                        |
| POST   | `/admin/quarantine/:id/review` | `{decision:"retain", note}` records a review and retains the original operation                                                                                                     |

Clinical writes require Health Worker, Reviewer or Hub Admin. Attendance and score writes require Teacher, Reviewer or Hub Admin. Common child registration is available to enrolled workers. The authorized school is bound to the enrolled device, never taken from a URL or request body.

The present trust boundary is an authorized **school workspace**: sync and bundle endpoints deliver its full consented log. This is not a claim of per-field read authorization.

## Manual database entry

Every record mutation below requires an `Idempotency-Key` header, 1–128 characters from letters, digits, `.`, `_`, `:`, or `-`. Generate a UUID for a new action. Keep it unchanged when retrying the exact same request. Reusing it for different input returns `409 IDEMPOTENCY_CONFLICT`.

| Method | Route                           | Body / response                                                                                                                        |
| ------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/children`                     | `q`, `class`, `village`, `offset`, `limit`, `includeDeleted=true`; returns `{records:[{record,version,updatedAt}],total,offset,limit}` |
| GET    | `/children/:id`                 | Child record, including archived state, causal version and update time                                                                 |
| POST   | `/children`                     | `{name,dob,class,village,guardian?,phone?,gender?,consent:true}`                                                                       |
| PATCH  | `/children/:id`                 | `{baseVersion,...changedFields}`; stale edits return 409                                                                               |
| POST   | `/children/:id/archive`         | `{baseVersion}` creates a tombstone, retaining history                                                                                 |
| POST   | `/children/:id/restore`         | `{baseVersion}` restores a tombstoned record                                                                                           |
| GET    | `/attendance?date=YYYY-MM-DD`   | Child rows, mark versions, counts, and conflict/unmarked totals; optional class/query/pagination                                       |
| PUT    | `/attendance`                   | `{date,marks:[{childId,status}],baseVersions?:{[childId]:version}}`; existing marks require their read versions                        |
| GET    | `/assessments`                  | Optional title/attempt/query/pagination; returns versioned records                                                                     |
| PUT    | `/assessments`                  | `{title,attempt,scores:[{childId,score}],baseVersions?}`; scores 0–100, attempts 1–100                                                 |
| POST   | `/children/:id/visits`          | `{date,note}`; worker provenance is added by the server                                                                                |
| POST   | `/children/:id/growth`          | `{date,weight,height,muac?}`; numeric range validation, no diagnosis                                                                   |
| POST   | `/children/:id/vaccinations`    | `{name,date,batch,site}`; an independent event is appended                                                                             |
| GET    | `/health/events`                | Optional childId/kind/pagination; authorized event history                                                                             |
| GET    | `/records`                      | Generic paginated materialized records; optional type/query/includeDeleted                                                             |
| GET    | `/conflicts`                    | All current alternatives with provenance                                                                                               |
| POST   | `/conflicts/:encodedId/resolve` | `{value,expectedOpIds,reason?}`; all reviewed alternatives must match the current frontier                                             |
| GET    | `/library`                      | Original bundled lesson text, options and attribution                                                                                  |
| GET    | `/learning/progress`            | Paginated recorded lesson attempts                                                                                                     |
| POST   | `/learning/progress`            | `{lessonId,childId?,answer}`; server checks the option and computes correctness                                                        |

Birth/event dates are real calendar dates, not future dates. A child must exist, be unarchived, and have affirmative consent before attendance, assessments or health events can be added through business routes. New children require consent. Batch validation completes before any changes commit.

Successful manual writes return operation IDs and the materialized record. The server allocates a **separate internal writer** for manual entry, so an offline device's local counter can never collide with a hub-issued operation. These same operations appear in subsequent offline delta pulls.

## Conflict and retry semantics

- Update/archive/restore use the version received with the record. The version hashes the entity's causal frontier, not a wall-clock winner.
- Batch attendance and score changes check all supplied versions in one transaction. One stale row aborts the whole batch.
- A normal update cannot overwrite an unresolved competing field. Use the Conflict inbox.
- This also applies to raw sync operations: an ordinary `set`, delete or restore whose causal context absorbs incompatible alternatives is rejected with `409 REVIEW_REQUIRED`. An explicit authorized `resolve` is required. A late offline change that observed only one side remains valid and concurrent.
- Resolution requires every current competing operation ID. A stale review returns 409 instead of dismissing a newer alternative.
- The operation log, encrypted materialization, and encrypted idempotency receipt commit together. Exact replay is checked before current record preconditions.

## Delta and recovery transport

`POST /sync` accepts `{protocol:1,ops,cursor,limit}` and returns `{accepted,quarantined,ops,cursor,more,checkpoint}`. Each push is bounded by operation count; the client additionally chunks by serialized bytes. The server bounds pull bytes and count, acknowledges after durable commit, and deduplicates accepted and quarantined IDs. Reusing an ID with different contents returns 409.

Causal parents must already be stored or present in the same complete request. Within a request, operations may arrive in any order; the hub processes parents first. Across requests, the client orders pending operations before chunking. Missing parents return `409 MISSING_DEPENDENCY`; self-dependencies and cycles return `409 INVALID_CAUSAL_HISTORY`. These failures roll back the request and do not acknowledge its new operations. Keep them pending and supply missing parents before retrying. A quarantined operation cannot serve as an accepted parent of a new operation.

`GET /bundle` exports a signed encrypted hub bundle. `POST /bundle` verifies its signature, school and original operation authors. A second hub must share the trust key and source device membership; automatic district federation is outside this build.

## Errors

Errors are JSON `{error,code,requestId?,details?}`. Validation details contain field paths and messages, not submitted sensitive values. Unknown API routes return JSON404 rather than the SPA HTML. Expected codes include 400 validation, 401 expired/unknown identity, 403 role/school/consent denial, 404 missing record, 409 stale version/idempotency/conflict, 413 oversized body and 429 rate limit.

## Example

```http
POST /api/children HTTP/1.1
Authorization: Bearer YOUR_DEVICE_TOKEN
Content-Type: application/json
Idempotency-Key: 33a086d3-3a98-4857-94e9-6f24cb5a799d

{"name":"Example Child","dob":"2019-04-15","class":"Class 2","village":"Dhareri","guardian":"Example Guardian","consent":true}
```

For normal use, open **Hub & devices → Database → New database record**. No SQL editing is required.
