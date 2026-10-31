# Security model and recovery

The default judge build uses synthetic records and clearly labeled open demo enrollment. Stage 2 also supports a first-administrator bootstrap token and one-time role-bound invitations, with demo enrollment disabled. The workspace still needs a privacy and clinical safety review before real use.

## Keys and integrity

- Device: random 256-bit AES-GCM DEK; random 96-bit nonce per encryption. PIN wraps the random DEK through PBKDF2-SHA-256, 310,000 iterations and a random 128-bit per-device salt. AAD binds ciphertext to `KUKA:v1`. Salt/wrapped key are stored beside ciphertext; the plaintext DEK is not persisted.
- Backups: independent salt and passphrase-derived AES-GCM key. They contain operation signatures and provenance but no login/recovery credentials. Wrong-password and tamper rejection occur before import. Restore accepts original KUKA/SetuSync/Smriva v1 files and legacy short passphrases; new exports retain the 10-character Settings policy. File, schema, school, causal-history and draft-collision failures leave the local encrypted state unchanged. See [backup transfer and verification](BACKUP_RESTORE.md).
- Operations: HMAC-SHA-256 binds the complete canonical operation envelope to the originating device's secret. The secret is the enrolled device token, stored only in the encrypted workspace and encrypted at the hub. Forwarding a restored signed operation does not require that token. Duplicate ID with different content is rejected, including before overwrite.
- Hub: operation bodies and signing secrets are AES-256-GCM encrypted under `HUB_ENCRYPTION_KEY`; identities, timestamps, school/device IDs and operation IDs remain in indexes. API bearer token is indexed only as SHA-256. Recovery codes are random 144-bit values, stored as hashes. School membership is verified before ingestion.
- Bundle: encrypted hub payload + HMAC over canonical metadata and ciphertext. It can be moved by USB; import requires the same hub key, matching school, valid signatures, and enrolled original source devices. Independent hubs do not automatically exchange device identities.

The known demo enrollment code is not production authentication. Controlled mode assigns roles from a single-use expiring invitation rather than client claims. A bootstrap token provisions only the first administrator. API enrollment/recovery is rate-limited. The server authorizes clinical/school writes according to the original signed author's enrolled role. Reviewer/Admin roles can use both domains. Sync and bundle read access remains scoped to the whole school; per-field clinical read ACLs are not implemented.

Manual API writes use a separate internal signing identity linked to the source device, never the offline client's counter. Encrypted idempotency receipts, operation insertion, projections and audit details commit together. Version guards reject stale modifications, and ordinary updates cannot overwrite an unresolved field. Invalid requests return field paths without reflecting submitted sensitive values.

Revocation is transactional, covers internal writers, and protects the last active Hub Admin. Reviewers cannot revoke an administrator. Recovery atomically creates a replacement and revokes the original. A local operator who controls the database/key can issue an invitation using the explicit CLI; that administrative code is intentionally displayed only to the invoking operator.

## Failures and boundaries

Lost locked device: local records remain encrypted. A short PIN can be guessed offline; use managed device encryption and stronger credentials in production. Lost unlocked device or malicious script: Web Crypto offers no protection against the active authorized session. Reload requires re-unlock. Idle timeout is a convenience lock and does not replace OS locking.

Revocation: the hub rejects the revoked device's authentication. Newly forwarded operations from that device are retained in encrypted quarantine. The build does not trust “created before revocation” wall times because a revoked author can backdate a signed operation. Previously accepted operations remain in the log. A device offline at revocation keeps its local copy until reconnect; remote wiping is not claimed.

Future clock: valid signed operations over five minutes ahead are preserved in quarantine instead of contaminating materialization. No automatic release UI is implemented; administrators must preserve the database and investigate. HLC ordering does not decide causal concurrency or record truth.

Tampered replay: HMAC mismatch, ID collision, or school mismatch rejects the batch atomically. Received values are runtime-validated. There is no permission to hard-delete synchronized operations. Seed authors are accepted only by the internal trusted seed path.

Data loss: acknowledged operations survive process restart through SQLite. Unacknowledged writes survive reload in IndexedDB. Lost local storage without an exported backup cannot be repaired by the server. Backup both the database and hub key.

Concurrent tabs compare the encrypted state's ciphertext and optional revision inside a short IndexedDB transaction before committing. Retries re-read current storage instead of overwriting another tab's changes. Counter/clock allocation uses the latest log, while causal dependencies use only the editing tab's observed operations; unseen competing values still require explicit review. Earlier writes in the same tab and operations within a batch retain their causal order. Contention is bounded and returns an explicit retry error. A lock generation guard prevents an asynchronous save, unlock or setup from restoring plaintext after locking. A save that already committed remains durable while the workspace stays locked.

Public pages contain build-rendered product information only. Workspace, recovery, administration and lab pages receive noindex metadata/headers, as do API responses; these are indexing instructions, not substitutes for authentication. Public metadata and sitemaps never include child records. An isolated non-indexed app shell supports offline navigation without public canonical redirects. Strict script CSP remains in force; browser schema validation disables optional JIT eval probes rather than allowing unsafe-eval.

Forgotten PIN: the PIN and local data key cannot be retrieved from the hub. Failed unlock attempts leave the encrypted wrapper and state unchanged. Recovery in the same browser creates a new IndexedDB namespace and retains the original locked database. A metadata-only localStorage registry selects between preserved workspaces; it contains no PINs, keys, device credentials or records. Recovering the hub identity revokes its predecessor and restores accepted hub records, not the old device's unsynchronized entries or drafts. Synthetic demo mode also allows a separate new enrollment without consuming a recovery code or revoking the original. These flows never overwrite or delete an existing workspace.

Use HTTPS outside localhost. Do not serve real records over public HTTP. The PWA caches the app shell and non-sensitive original learning assets; API responses are excluded. No patient identifiers are logged or sent to external AI services.

## Hub key rotation procedure

1. Stop all writers and the hub. Snapshot SQLite using the SQLite backup API or stop the process and copy the database; include WAL/SHM if copying while a connection could still be live. Export the existing key separately to protected storage.
2. Generate a new random 32-byte key. In a maintenance process holding both keys, open the database with the old `HubStore` key. Within a single transaction, decrypt and re-encrypt every `operations.body`, `quarantine.body`, `devices.signing_secret`, `materialized_records.body`, `conflict_projection.body`, `command_receipts.body`, and non-null `audit.body` with the new key. Verify operation plaintext hashes and row counts before committing. Device HMAC secrets remain the same; only their envelope key changes.
3. Verify a restored copy using the new key, replay a test batch, and validate a full pull against the pre-rotation canonical digest. Atomically change the environment secret, then restart the hub.
4. Preserve a secured old-key backup according to retention policy; reissue old USB bundles because their hub signatures/envelopes use the old key. Do not destroy the previous key until restore validation succeeds.

This is an operator procedure; an automatic rotation command and managed KMS are not implemented.
