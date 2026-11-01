import React from 'react';
import { ArrowRight, Check, Database, Globe2, ShieldCheck, WifiOff } from 'lucide-react';

/** Public, synthetic-data-only content. Also rendered to HTML during the build. */
export default function PublicHome() {
  return (
    <div className="public-site" lang="en">
      <a className="skip-link" href="#public-main">
        Skip to content
      </a>
      <div className="public-announcement">
        <span>Built for work beyond reliable connectivity</span>
        <a href="#platform">Explore the platform <ArrowRight size={14} aria-hidden="true" /></a>
      </div>
      <header className="public-header">
        <a className="brand public-brand" href="/" aria-label="Smriva home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <ellipse cx="24" cy="24" rx="18" ry="7" />
              <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(60 24 24)" />
              <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(120 24 24)" />
              <circle className="orbit-core" cx="24" cy="24" r="3" />
            </svg>
          </span>
          <strong>Smriva</strong>
        </a>
        <nav aria-label="Public pages">
          <a href="#platform">Platform</a>
          <a href="#how-it-works">How it works</a>
          <a href="/about">Sources &amp; security</a>
          <a className="button primary" href="/app/today">
            Open workspace <ArrowRight size={16} aria-hidden="true" />
          </a>
        </nav>
      </header>
      <main id="public-main" tabIndex={-1}>
        <section className="public-hero" aria-labelledby="public-title">
          <div className="public-hero-copy">
            <p className="public-kicker">School registers &amp; community care</p>
            <h1 id="public-title">
              Offline records.
              <br />
              Connected communities.
            </h1>
            <p className="public-intro">
              Take attendance. Record a visit. Come back to an unfinished entry. Smriva keeps this work on
              your device, then copies it to remote backup when a connection is available.
            </p>
            <div className="public-actions">
              <a className="button primary" href="/app/today">
                Get started <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a className="public-quiet-link" href="#how-it-works">
                See how it works
              </a>
            </div>
            <p className="public-demo-note">
              This is a working demo with fictional records. You can try it without a cloud account.
            </p>
          </div>
          <figure className="public-register">
            <div className="public-data-orbit" aria-hidden="true">
              <span className="orbit-ring orbit-ring-one" />
              <span className="orbit-ring orbit-ring-two" />
              <span className="orbit-node orbit-node-one" />
              <span className="orbit-node orbit-node-two" />
              <span className="orbit-node orbit-node-three" />
              <span className="orbit-word">offline</span>
              <span className="orbit-word">encrypted</span>
              <span className="orbit-word">reviewable</span>
            </div>
            <figcaption>
              <span>A page from the demo</span>
              <strong>Attendance register</strong>
              <span>Class 1 · Synthetic example</span>
            </figcaption>
            <table aria-label="Synthetic attendance example">
              <thead>
                <tr>
                  <th scope="col">Child</th>
                  <th scope="col">Attendance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Aarohi Kaur</th>
                  <td>Present</td>
                </tr>
                <tr>
                  <th scope="row">Arjun Sharma</th>
                  <td>Present</td>
                </tr>
                <tr>
                  <th scope="row">Anaya Devi</th>
                  <td>Absent</td>
                </tr>
              </tbody>
            </table>
            <p className="public-register-status">
              <span aria-hidden="true" /> Example: saved on this device, waiting to copy.
            </p>
            <p className="public-register-note">
              Two entries disagree? Both stay available for someone to check.
            </p>
          </figure>
        </section>
        <div className="public-marquee" aria-label="Smriva capabilities">
          <div>
            <span>Offline-first records</span><i aria-hidden="true" />
            <span>Conflict-aware attendance</span><i aria-hidden="true" />
            <span>Encrypted on device</span><i aria-hidden="true" />
            <span>English · हिंदी · ਪੰਜਾਬੀ</span><i aria-hidden="true" />
            <span aria-hidden="true">Offline-first records</span><i aria-hidden="true" />
            <span aria-hidden="true">Conflict-aware attendance</span><i aria-hidden="true" />
          </div>
        </div>
        <section id="platform" className="public-platform" aria-labelledby="platform-title">
          <div className="public-section-heading">
            <p className="public-kicker">A resilient record platform</p>
            <h2 id="platform-title">One place to capture, protect and reconcile essential work.</h2>
          </div>
          <div className="public-platform-grid">
            <article>
              <WifiOff aria-hidden="true" />
              <span>01</span>
              <h3>Keep working offline</h3>
              <p>Attendance, visits and follow-ups remain available on the device when the network disappears.</p>
              <a href="#how-it-works">Local durability <ArrowRight size={15} /></a>
            </article>
            <article>
              <ShieldCheck aria-hidden="true" />
              <span>02</span>
              <h3>Review every difference</h3>
              <p>Conflicting attendance from another device is preserved and routed to one clear review queue.</p>
              <a href="/app/conflicts">Conflict inbox <ArrowRight size={15} /></a>
            </article>
            <article>
              <Globe2 aria-hidden="true" />
              <span>03</span>
              <h3>Meet people in their language</h3>
              <p>Switch the interface between English, Hindi and Punjabi without changing the saved record.</p>
              <a href="/app/today">Open workspace <ArrowRight size={15} /></a>
            </article>
            <article>
              <Database aria-hidden="true" />
              <span>04</span>
              <h3>Understand every save</h3>
              <p>See what is stored locally, what is waiting to sync and what needs a human decision.</p>
              <a href="/app/settings">Sync settings <ArrowRight size={15} /></a>
            </article>
          </div>
        </section>
        <section className="public-proof" aria-labelledby="proof-title">
          <div>
            <p className="public-kicker">Designed to make state visible</p>
            <h2 id="proof-title">Records should never vanish into a spinner.</h2>
          </div>
          <dl>
            <div><dt>3</dt><dd>interface languages</dd></div>
            <div><dt>2</dt><dd>essential workflows: school and care</dd></div>
            <div><dt><Check size={30} aria-hidden="true" /></dt><dd>every conflicting alternative retained for review</dd></div>
          </dl>
        </section>
        <section className="public-features" aria-labelledby="public-work-title">
          <h2 id="public-work-title">One workspace for school and care.</h2>
          <div className="public-use-list">
            <article>
              <span>School</span>
              <div>
                <h3>A school register</h3>
                <p>
                  Mark attendance, enter assessment scores and find a child’s earlier records. The learning
                  library has four lessons you can use offline.
                </p>
              </div>
            </article>
            <article>
              <span>Care</span>
              <div>
                <h3>A record of care</h3>
                <p>
                  Add consent-linked visits, vaccinations and growth observations. Earlier entries stay in the
                  history when a correction is made.
                </p>
              </div>
            </article>
            <article>
              <span>Getting started</span>
              <div>
                <h3>Three interface languages</h3>
                <p>
                  Choose English, Hindi or Punjabi at the top of the workspace without changing saved records.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section id="how-it-works" className="public-how" aria-labelledby="how-title">
          <div>
            <p className="public-kicker">A note about saving</p>
            <h2 id="how-title">Know where each entry is saved.</h2>
            <p>
              Start on a connected device to enroll and prepare the app. After that, your PIN opens the
              encrypted local workspace offline.
            </p>
          </div>
          <dl className="public-saving-definitions">
            <div>
              <dt>Saved here</dt>
              <dd>The device has committed the encrypted entry. You can open it again without internet.</dd>
            </div>
            <div>
              <dt>Copied to remote backup</dt>
              <dd>The server has acknowledged the change. An interrupted transfer can be tried again.</dd>
            </div>
            <div>
              <dt>Needs review</dt>
              <dd>
                Two people entered different information. Both accounts are kept until someone checks them.
              </dd>
            </div>
          </dl>
        </section>
        <section className="public-faq" aria-labelledby="faq-title">
          <h2 id="faq-title">Before you begin</h2>
          <details>
            <summary>Does Smriva work without internet?</summary>
            <p>
              After the first connected setup and app download, you can unlock and enter records offline.
              Synchronization, new enrollment and remote administration require a connection.
            </p>
          </details>
          <details>
            <summary>What happens if two people edit the same record?</summary>
            <p>
              Independent entries are preserved. Compatible events can merge, while incompatible values appear
              for review. A clock alone does not choose whose account is correct.
            </p>
          </details>
          <details>
            <summary>Is this ready for real clinical records?</summary>
            <p>
              This is a whole-grade project using synthetic records, not a certified clinical system.
              Deployment needs HTTPS, managed keys and an organization-specific privacy and clinical-safety
              review. Smriva records observations; it does not diagnose or prescribe.
            </p>
          </details>
        </section>
        <section className="public-start">
          <div>
            <h2>Try the demonstration workspace.</h2>
            <p>Choose a name, a role and a device PIN to begin.</p>
          </div>
          <a className="button primary" href="/app/today">
            Enter the workspace <ArrowRight size={16} aria-hidden="true" />
          </a>
        </section>
      </main>
      <footer className="public-footer">
        <span>Smriva · Synthetic demonstration records</span>
        <nav aria-label="More information">
          <a href="/about">About, sources &amp; limits</a>
          <a href="/app/today">Workspace</a>
        </nav>
      </footer>
    </div>
  );
}
