# Independent-device verification

Use two browser profiles or one normal window plus one incognito window. Two tabs using the same IndexedDB database are not independent devices. Alternatively, the lab deliberately uses `kuka-lab-a` and `kuka-lab-b` databases.

1. Run the production hub and open http://localhost:3001 in both profiles. Enroll as Reviewer with different worker names and PINs. Wait for each initial sync to finish.
2. Open Classroom in both. In browser devtools set each network Offline. Mark the same child/date Present on A and Absent on B. The save message appears only after encrypted local commit.
3. Reload A while offline, enter its PIN, and verify the mark remains. The service worker must have finished installing before entering offline mode.
4. Restore connectivity. Sync A, then B, then A again; B again if needed to see the other device's latest operations. This is a delta exchange, not a magical simultaneous global transaction.
5. Open Conflict inbox. Both marks, author identities, devices, timestamps, and causal details remain visible. Choose one. Sync the resolver, then both devices. The review closes and both materializations agree.
6. For a score conflict, use the same assessment title and attempt number on both profiles, with different scores. Distinct attempt numbers intentionally stay separate.
7. Use Settings to export an encrypted backup with a strong passphrase. On a different authorized device import the backup. Signed unsynced operations can be forwarded without importing original login credentials. A wrong passphrase imports nothing.
8. Copy a recovery code somewhere safe. In a fresh profile open `/recover`. The hub enrolls a new identity, revokes the old device, and restores synchronized data. A lost PIN alone does not decrypt an old device's local-only work.

Automated equivalent: run `npm run build`, then `npm run test:e2e`. The test runner starts its own isolated hub/database on port 3002. The test contexts have independent storage, caches, sessions, and network controls.
