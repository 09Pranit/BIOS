# Open Smriva on another device

Only the hub computer needs Node.js 24+ and npm. Phones, tablets and other computers open the hub's HTTPS address in their browser. They do not install Node or copy the database. Each browser has its own PIN and encrypted local workspace; records are shared through the same hub or an encrypted Settings backup.

## Start the hub

Windows:

```powershell
.\start-smriva.ps1
# Or double-click start-smriva.cmd.
```

macOS/Linux:

```sh
sh ./start-smriva.sh
```

The launchers install missing dependencies and build a missing production bundle. After changing source files, run `npm run build` before starting again. The server prints its actual protocol, port and addresses. Local-only startup stays on loopback.

For a hub listening on the local network:

```sh
npm run start:lan
```

Windows also supports `start-smriva.cmd -Lan`; macOS/Linux supports `sh ./start-smriva.sh --lan`. Connect both devices to the same network and allow the chosen server port through the host firewall. The printed non-localhost address identifies the hub computer. A localhost link entered on a phone points at the phone itself.

## HTTPS for phones and other computers

Browsers require a secure context for Web Crypto and service workers. HTTP localhost is a development exception; an HTTP Wi-Fi IP address is not. Smriva checks this before enrollment and explains what to change, while leaving stored records intact. See [MDN secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts).

Choose either native HTTPS or an HTTPS proxy.

### Native HTTPS with an existing trusted certificate

Add to the hub's private `.env`:

```dotenv
HOST=0.0.0.0
PORT=3443
TLS_CERT_FILE=./certs/certificate.pem
TLS_KEY_FILE=./certs/private-key.pem
```

Then run `npm start` and use the printed `https://...:3443` address. The certificate must cover the hostname/IP being opened and be trusted by each connecting device. For a local CA, its administrator must arrange trust on those devices. No browser security settings are disabled by the project.

A Windows PKCS#12 certificate can be used instead of the PEM pair:

```dotenv
HOST=0.0.0.0
PORT=3443
TLS_PFX_FILE=./certs/hub.pfx
TLS_PFX_PASSPHRASE=your-private-certificate-password
```

Use either PFX or PEM, not both. Certificate folders, private `.env`, runtime databases and hub keys are excluded from the release archive. Native TLS configuration applies to the production hub; use the default local configuration for `npm run dev`.

### Public hostname with automatic HTTPS

The supplied Caddy proxy can obtain and renew a public certificate. Set `SMRIVA_DOMAIN` in the private `.env` to a real DNS hostname pointing at this server, make ports 80 and 443 reachable, then run:

```sh
docker compose -f docker-compose.yml -f docker-compose.https.yml up --build -d
```

Open `https://your-hostname` on each device. The existing `kuka-data` volume remains the hub storage; the extra Caddy volumes retain certificate state. The overlay configures one trusted proxy hop so rate limiting sees individual clients. Direct startup defaults to zero trusted hops. The direct container HTTP port stays bound to host loopback unless `SMRIVA_BIND` is explicitly changed. See [Caddy's HTTPS requirements](https://caddyserver.com/docs/automatic-https).

This command is a deployment template, not a hosted service. No public hostname or certificate has been provisioned for this workspace. Choose controlled enrollment with `npm run setup:production` for a new non-demo hub; preserve existing configuration and data when upgrading.

## Browser behavior

- Frontend syntax targets ES2020 and Safari 14.1. This is a compatibility target, not physical-device certification. Current Chrome, Edge, Firefox and Safari are the intended clients.
- Missing `crypto.randomUUID`, `AbortSignal.timeout`, `Object.hasOwn`, array `.at`, modern form-submit helpers and locale-specific date formatting no longer block ordinary data entry. IDs remain cryptographically random.
- Touch inputs use readable 16px text and larger controls. Phone modals have a viewport fallback, the bottom navigation accounts for safe areas, and native page zoom remains enabled.
- Actual IndexedDB writes are checked before setup. Restricted embedded browsers are directed to a normal browser with site storage enabled.
- Encrypted entry can still run when offline installation is unavailable. The header reports that limitation instead of claiming the shell is ready. For offline reload, open the app while connected and wait for **Offline ready** first.
- Unsupported non-module browsers and disabled JavaScript receive explanatory content. They cannot edit encrypted records.
- Browser storage belongs to an origin. HTTP, HTTPS, different hostnames and different ports have separate local workspaces. Keep the original origin accessible when changing addresses; transfer unsynchronized work with a Settings backup and its original passphrase.

## Verification

The compatibility suite is separate from the existing merge/recovery/UI regression suite:

```sh
npm ci
npx playwright install chromium firefox webkit
npm run build
npm run test:devices
```

On Windows, use `CHROME_PATH` to point Chromium projects at an installed Chrome executable if needed. Set `EDGE_PATH` to an installed Edge executable to include its additional four cases. The matrix includes desktop Chrome, desktop Firefox, an emulated WebKit iPhone, a 768px tablet and a 320px phone. It exercises encrypted creation, Unicode records, offline reload/unlock, backup export/import, missing API fallbacks, restricted storage, HTTPS guidance and horizontal overflow.

Verification on 1 November 2026: the recorded runs passed all **20 Chrome/Firefox/Edge cases** and all **266 automated tests**. All 29 regression scenarios were verified: 28 passed in the full run, and the attendance case passed a focused rerun after making its setup independent of the demo date. [Machine-readable results](device-compatibility-results.json). WebKit could not be downloaded because the browser CDN connection reset and DNS resolution failed, so its four cases are present but unverified. Native HTTPS was independently tested with a per-request trusted ephemeral certificate: health and workspace returned 200, enrollment returned 201, and the test used an in-memory database. Docker was unavailable, so the Caddy deployment was not launched. No system certificate trust or firewall settings were changed.
