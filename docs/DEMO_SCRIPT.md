# Three minutes with Smriva

Before the demonstration: `npm run build && npm start`. Open http://localhost:3001. The Smriva workspace uses compact registers and a restrained green palette; the Hub database page supports direct server entry. Create a Community member workspace, choose a PIN you remember, and wait until Synced. The standard dashboard remains available; switch on Easy mode to show larger controls and everyday task names. Use the production build so the service worker has installed. Keep the laptop running the hub even if internet Wi-Fi is disconnected.

**0:00–0:25 — The person behind the record.** Open Today, then a child profile. “A teacher and a health worker carry different parts of the same child’s story. Their connection is rare; their data should not be disposable.” Point out synthetic demo data, consent, saved-here vs backed-up states.

**0:25–1:10 — Pull the plug.** Enter Resilience lab. Initialize the two independent encrypted device databases. Leave the link Offline and create the concurrent scenario. Show the different DOB values and 49 committed operations. Set 2G and reconnect. After a chunk commits, press Kill transfer. Read the persisted cursors; click Reconnect again. Let the judge select the profile or edit the DOB values.

**1:10–1:45 — Two accounts, one human decision.** Show “Two dates. Both kept.” Two people edited without seeing one another, so a timestamp cannot decide. Confirm one DOB. The resolution becomes a new operation referencing both alternatives. The alternatives remain in the operation history.

**1:45–2:15 — A lost phone, a preserved story.** Ensure Device A has no pending work. Click Lost phone drill. This deletes only the lab device A database, recovers a new identity using its recovery code, revokes the old identity, and pulls acknowledged data. Read the actual recovered digest-match result. Explain that unsynced work without backup cannot be recovered.

**2:15–2:50 — Inspect the evidence.** Run a chaos seed chosen by the judge. Describe the scope accurately: in-process packet-loss simulation with eventual connectivity, separate from real HTTP timings. Show 240 created/preserved operations, open conflicts, duplicates, and the LWW baseline’s lost append-only events. Export the JSON evidence.

**2:50–3:00 — The finish.** “Every record survives the journey—in these tested runs. And the places we have not proved yet are documented.” Open the requirements map if asked.

## Judge challenge

Offer the judge the two DOB values, a chaos seed, link profile, and the moment to kill a transfer. This is real execution, so results are measured rather than canned. If a full 2G pull takes too long, switch to Good for completion; say so visibly.

## Backup plans

- Internet unavailable: everything core runs on the laptop village hub. Cached lessons, PIN unlock, records and lab need no cloud service.
- Hub stopped: local entries still save; the lab cannot sync until the Node hub restarts. Show pending operations and restart the owned hub. Do not claim a successful backup.
- Sponsor/AI unavailable: no core behavior depends on them; Admin clearly says not configured. No fabricated integration statuses.
- Browser storage unavailable/full: the app reports that the new change was not saved. Export earlier records if storage permits, free unrelated space, and retry. Do not clear the site’s database without an export.
- Existing lab records remain: create a new scenario ID. Do not erase a real teacher workspace.
- Session locked after reload: enter the PIN. Keys deliberately stay only in memory while unlocked.
