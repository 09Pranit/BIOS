# Merge and conflict verification

Audit date: 31 October 2026. Tests use synthetic records, isolated SQLite databases and independent browser storage. The application's existing records were not used as test inputs.

## Verdict

The tested health and school record flows preserve competing values, surface an explicit conflict and retain the originals after a person records a resolution. Safe changes to different fields or independent append-only events merge without a forced winner. Hybrid logical clocks do not choose between incompatible values.

The audit found a real review bypass and fixed it before reporting success. An ordinary local edit could previously consume the causal history of both alternatives and replace a conflict through a normal `set`. The child form also wrote unchanged profile fields, creating unnecessary conflicts between otherwise independent corrections.

## Fixes made

- Local `write` and `writeMany` refuse ordinary changes that absorb an observed conflict. A failed batch commits none of its operations.
- The normal child correction button is disabled while the record needs review. The Conflict inbox remains available.
- Child forms write only changed fields and retain their original displayed causal context. An edit arriving through background sync cannot silently become an observed predecessor of an unfinished form.
- Hub ingestion enforces the review rule using each operation's causal ancestors, rather than rejecting every late offline edit just because the hub currently has a conflict. Unsafe ordinary overwrites return `409 REVIEW_REQUIRED` without acknowledging or committing the batch.
- Missing parents and self/cyclic dependency histories are rejected atomically. Complete batches can arrive in reverse order; outgoing client batches put parents before descendants. Missing-history errors leave operations pending for a safe retry.
- Encrypted backup imports validate causal history and explicit review before committing operations or drafts. A rejected import leaves the encrypted local row unchanged.

Existing immutable operation IDs, signatures, database names and encryption formats are retained. No original operation is deleted to resolve a conflict.

## Tested cases

| Situation                                                                               | Observed result                                                                                                                 |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Concurrent different DOB, attendance, score, consent and other critical register values | Both alternatives retained; one explicit conflict; projected field is unresolved rather than clock-selected.                    |
| Concurrent identical values                                                             | No unnecessary conflict; both original operations retained.                                                                     |
| Different profile fields edited through two actual offline forms                        | Both corrections merged; no conflict; history contained six creation operations and exactly two changed-field operations.       |
| Two independent offline health visits                                                   | Both events retained exactly once.                                                                                              |
| One device deletes while another edits                                                  | Explicit deletion/edit conflict with both accounts; keeping the edit restores the record without deleting the deletion history. |
| Manual corrected DOB through the Conflict inbox                                         | Reviewed value reaches both devices; both earlier dates and their authors remain in history; final log checksums match.         |
| Ordinary correction over an observed conflict                                           | Refused locally and by the raw sync/business APIs.                                                                              |
| An unseen third edit arrives after two alternatives were reviewed                       | Remains a conflict; the review cannot erase the unseen edit.                                                                    |
| An online review submits an outdated alternative set                                    | `409 CONFLICT_CHANGED`; no review receipt or changes committed.                                                                 |
| Two people independently choose incompatible resolutions                                | A new explicit conflict; a subsequent joint review converges.                                                                   |
| A form stays open while a remote correction arrives                                     | Saving from the original displayed context produces a conflict rather than overwriting the unseen edit.                         |
| A clock is far ahead in the core merge test                                             | No last-writer-wins selection. At the hub, uploads more than five minutes ahead are separately quarantined.                     |
| Duplicate delivery / identical request replay                                           | No repeated event, operation or resolution audit decision.                                                                      |
| Acknowledgement lost after server commit                                                | Retry recognizes the existing operation and completes without duplicating it.                                                   |
| Pull interrupted after its first 32-operation page                                      | Encrypted cursor survives reopening; remaining operations resume from that checkpoint.                                          |
| An 80-operation causal chain crosses 32/32/16-sized chunks                              | Each parent is sent before its descendant, including IDs whose lexical order differs from causal order.                         |
| Missing dependency, self-reference or cycle                                             | Explicit error and no partially acknowledged invalid history; a missing-parent transfer succeeds after the parent is supplied.  |
| A descendant depends on an operation quarantined in the same batch                      | Entire request rolls back; the descendant is not acknowledged with an incomplete history.                                       |
| Teacher attempts to resolve a clinical-only field                                       | `403 ROLE_FORBIDDEN`; no operation or internal writer committed.                                                                |
| Unsafe or cyclic encrypted backup                                                       | Import fails atomically; existing records, conflicts, drafts and stored ciphertext remain unchanged.                            |

Core and API evidence: [merge contracts](../tests/merge-contract.test.ts), [API and local-entry contracts](../tests/merge-api-contract.test.ts), [original core tests](../tests/core.test.ts), [Vault interruption tests](../tests/vault.test.ts) and [business API tests](../tests/business-api.test.ts).

Browser evidence: [three real-interface scenarios](../tests/e2e/merge-review.spec.ts), plus the existing independent-device attendance and shared-browser scenarios. [Conflict review screenshot](smriva-conflict-review.png) shows synthetic conflicting dates with attributed authors and the explicit review controls.

## Simulation results

[Fresh benchmark results](benchmark-results.json) contain nine runs: three seeds each with 3, 8 and 16 devices. Each run creates 240 operations, uses 60% simulated packet loss, duplicate/reordered delivery and a forced eventual reconnect.

- 2,160 operation instances created across the nine separate runs; 2,160 retained.
- Zero lost operations and zero duplicate effects in these runs.
- All nine runs converged; each retained eight intentionally created conflicts for review.

This is a deterministic in-process simulator. Its CPU durations and aggregate serialized payload sizes are not real mobile-network latency measurements or field guarantees. The UI's Sync center separately records actual HTTP payload bytes and request duration.

## How it compares with GitHub

The workflow is similar: compatible changes combine, competing changes stay explicit, and an authorized person records a resolution. GitHub's merge conflicts normally concern competing file content or deletion/editing, and unresolved conflicts prevent completing that pull-request merge. See [GitHub's official merge-conflict reference](https://docs.github.com/en/pull-requests/reference/merge-conflicts).

Smriva uses typed record fields, append-only events and causal operation history. It is not a Git repository and has no branches, pull requests or Git text conflict markers. It synchronizes both alternatives and flags the affected record while unrelated valid records can continue syncing. Choosing a resolution adds a signed `resolve` operation instead of a Git merge commit.

## Scope and limits

- These results establish the cases tested, not a universal proof of zero data loss or clinical correctness.
- Independently entered copies of the same real-world visit, vaccination or person with different operation/record IDs are retained separately. Semantic duplicate detection and automatic identity matching are not implemented.
- The stock counter preserves concurrent numeric deltas, but does not enforce a non-negative inventory invariant. No production stock-entry interface or bounded inventory CRDT is claimed.
- A disputed deletion can appear archived in the ordinary roster until the explicit deletion conflict is resolved. The conflicting edit remains in the Conflict inbox and immutable history.
- The pure merge projection assumes valid operation histories. New normal local writes, backup imports and hub ingestion now validate their relevant entry paths; historical accepted logs are not rewritten by this update.
- Signatures establish authorship and integrity. An authorized author's explicit `resolve` asserts a decision; cryptography cannot establish that a person thoughtfully reviewed it.

## Verification and reproduction

The production build and 188 automated tests passed, including 35 new core contracts and 22 new API/local-entry contracts. All 26 browser scenarios passed in the complete regression run, including the three new merge/review scenarios. All nine refreshed simulation runs passed as described above.

```sh
npm test
npm run chaos
npm run build
npm run test:e2e
```

The browser suite launches its own hub and database on port 3002. The working application remains on port 3001. A pre-update database snapshot was saved locally under `backups/`; it is excluded from the source archive. After restarting the local hub, all 215 pre-existing encrypted operation bodies/checksums were verified unchanged, and SQLite `quick_check` returned `ok`.
