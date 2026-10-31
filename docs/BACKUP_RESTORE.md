# Backup transfer and restore

The Settings backup contains encrypted signed operations and unfinished drafts. Its passphrase is independent of either device's PIN. Credentials and recovery codes are not copied.

## Transfer to another device

1. On the original device, open **Settings → Save a backup**, enter a passphrase of at least 10 characters, and select **Export backup**. Keep the passphrase separately.
2. Transfer the actual downloaded `smriva-encrypted-backup.json`. Download cloud attachments locally before selecting them.
3. Open the updated app on the destination device, enroll it with the same hub and school, and choose its device PIN. Use HTTPS, or localhost for local development, so browser encryption is available.
4. In **Settings → Restore from another device**, enter the original backup passphrase and select **Import backup**. Existing records remain. Importing the same operation IDs again has no duplicate effect.
5. Inspect the restored records and drafts. Sync with the original hub when connected. Original signatures, author permissions and revocation checks still apply.

The restore field accepts older short passphrases. New exports still require 10 characters in Settings. Version 1 `kuka-backup`, `setusync-backup` and `smriva-backup` files retain their original PBKDF2 settings and encryption AAD. UTF-8 and BOM-marked UTF-16 copies are supported.

## Fixes

- Separated export and restore passwords. The new-export rule no longer blocks valid old files or suggests using the new device's PIN.
- Added actionable errors for unreadable files, invalid JSON, unrelated JSON, truncated envelopes, newer versions, unavailable browser encryption and authentication failures. Parser errors do not echo private file contents. Messages are available in English, Hindi and Punjabi.
- Checked history completeness before export. An interrupted older sync could export descendants without their parents, producing a file that failed on a fresh device. Finish Sync Center on the original device and export again. Existing incomplete files fail atomically with this instruction.
- Restored assessment titles and attempts even before scores exist. Conflicting local drafts block the complete import instead of being overwritten.
- Made immutable date validation independent of the receiver's current date. Dates are bounded by the signed operation's HLC and the latest possible author calendar day. Manual forms retain future-date rejection, and the hub retains future-clock quarantine. Synthetic merge fixtures now use calendar-consistent timestamps.
- Retained school/schema/history validation and explicit conflict review. An import cannot absorb an observed unresolved conflict through an ordinary correction.

The original backup passphrase and a complete valid history are required. A hub USB bundle, SQLite file, CSV, recovery code or file-preview webpage is a different format. An independently installed hub needs the original device identities and trust configuration; a backup does not provision credentials. Historical custom/raw writers with dates later than their recorded clocks may fail the new chronology check; normal app exports and all 215 existing hub operations pass it.

## Verification — 31 October 2026

- Production build, TypeScript and 21 bundled-source checks passed.
- All **241 automated tests** passed, including independent Node crypto interoperability, legacy formats, encodings, different PINs, Unicode, draft restoration, incomplete history and clock changes.
- The complete **29-scenario browser suite** passed, including the existing merge/conflict, accessibility, recovery and offline-entry checks.
- Three new Settings browser scenarios passed using actual file download/upload: an independent Android-emulated Chrome context, offline restore/reload, preserved log digest, idempotent import, malformed files, wrong-password retry, and an independently encrypted KUKA file with a six-character passphrase saved as UTF-16LE.
- The local hub was restarted. All **215 original encrypted operations** remained byte-for-byte unchanged, passed replay validation, and had complete ancestry. SQLite `quick_check` returned `ok`.

The phone scenario uses Chrome device emulation. Physical Android/iOS and Safari have not been certified. [Phone Settings capture](smriva-backup-restore-phone.png).
