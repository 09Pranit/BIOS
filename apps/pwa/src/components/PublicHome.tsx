import { ArrowDown, ArrowRight, BookOpen, Check, Globe2, LockKeyhole, ShieldCheck } from 'lucide-react';
import RecordNetwork from './RecordNetwork';

export default function PublicHome() {
  return (
    <div className="public-site" lang="en">
      <a className="skip-link" href="#public-main">
        Skip to content
      </a>
      <header className="public-header public-container">
        <a className="public-brand" href="/">
          <span className="public-brand-symbol" aria-hidden="true">
            s<span>·</span>
          </span>
          <strong>Smriva</strong>
        </a>
        <nav aria-label="Public pages">
          <a href="#the-workspace">The workspace</a>
          <a href="#how-it-works">How it works</a>
          <a href="/about">Sources &amp; security</a>
        </nav>
        <a className="public-button public-button-small" href="/app/today">
          Open workspace <ArrowRight size={16} aria-hidden="true" />
        </a>
      </header>
      <main id="public-main" tabIndex={-1}>
        <section className="public-hero public-container" aria-labelledby="public-title">
          <div className="public-hero-copy">
            <p className="public-kicker">
              <span /> Built for the school day
            </p>
            <h1 id="public-title">
              A school day
              <br />
              shouldn’t depend
              <br />
              on a <em>signal.</em>
            </h1>
            <p className="public-intro">
              Take attendance. Record a little progress. Pick up where you left off. School records that stay
              with you, even when the internet doesn’t.
            </p>
            <div className="public-actions">
              <a className="public-button" href="/app/today">
                Try the workspace <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a className="public-text-link" href="#the-workspace">
                Take a closer look <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
            <p className="public-demo-note">
              A working hackathon demo. Fictional records. No cloud account needed.
            </p>
          </div>
          <RecordNetwork />
        </section>
        <div className="public-principles public-container" aria-label="Workspace capabilities">
          <span>
            <Check size={16} aria-hidden="true" /> Offline after first setup
          </span>
          <span>
            <LockKeyhole size={16} aria-hidden="true" /> Encrypted on your device
          </span>
          <span>
            <Globe2 size={16} aria-hidden="true" /> English · हिन्दी · ਪੰਜਾਬੀ
          </span>
          <a href="/about">
            Built at BIOS V2 <ArrowRight size={14} aria-hidden="true" />
          </a>
        </div>
        <section
          id="the-workspace"
          className="public-workspace public-container"
          aria-labelledby="workspace-title"
        >
          <div className="public-section-heading">
            <div>
              <p className="public-kicker">Less paperwork. More school.</p>
              <h2 id="workspace-title">
                The everyday work,
                <br />
                <em>all in one place.</em>
              </h2>
            </div>
            <p>
              One register for the people doing the work. A clear record for the next person who needs it.
            </p>
          </div>
          <div className="public-product">
            <div className="public-product-copy">
              <BookOpen size={27} aria-hidden="true" />
              <h3>Start with the register.</h3>
              <p>
                Mark a class in a few taps. Find a student’s earlier assessments. Leave an unfinished score
                and return to it later.
              </p>
              <a className="public-text-link" href="/app/school">
                Open the classroom <ArrowRight size={16} aria-hidden="true" />
              </a>
              <span className="public-example-label">Illustrative preview · fictional students</span>
            </div>
            <figure className="public-register">
              <figcaption>
                <div>
                  <span className="public-register-overline">Dhareri · Village workspace</span>
                  <strong>Attendance register</strong>
                </div>
                <span className="public-local-label">
                  <span /> Saved here
                </span>
              </figcaption>
              <div className="public-register-toolbar">
                <span>Class 1</span>
                <span>Morning register</span>
              </div>
              <table aria-label="Synthetic attendance example">
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col">Attendance</th>
                    <th scope="col" className="public-save-column">
                      Entry
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">
                      <span className="public-initial">AK</span>Aarohi Kaur
                    </th>
                    <td>
                      <span className="public-attendance present">Present</span>
                    </td>
                    <td className="public-save-column">
                      <Check size={15} aria-label="Saved" />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">
                      <span className="public-initial">AS</span>Arjun Sharma
                    </th>
                    <td>
                      <span className="public-attendance present">Present</span>
                    </td>
                    <td className="public-save-column">
                      <Check size={15} aria-label="Saved" />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">
                      <span className="public-initial">AD</span>Anaya Devi
                    </th>
                    <td>
                      <span className="public-attendance absent">Absent</span>
                    </td>
                    <td className="public-save-column">
                      <Check size={15} aria-label="Saved" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="public-register-status">
                <LockKeyhole size={13} aria-hidden="true" /> Example: saved on this device, ready to sync.
              </p>
            </figure>
          </div>
          <div className="public-use-list">
            <article>
              <span>01 / The classroom</span>
              <h3>A record of progress.</h3>
              <p>Attendance and assessment history together. Corrections preserve earlier entries.</p>
            </article>
            <article>
              <span>02 / The community</span>
              <h3>A separate doctor’s register.</h3>
              <p>Record patient visits by name, date, time and purpose, apart from the school roster.</p>
            </article>
            <article>
              <span>03 / The resources</span>
              <h3>A route to official schemes.</h3>
              <p>Find six education programmes, with links to their official government websites.</p>
            </article>
          </div>
        </section>
        <section id="how-it-works" className="public-how" aria-labelledby="how-title">
          <div className="public-container">
            <div className="public-section-heading">
              <div>
                <p className="public-kicker">Connection comes and goes. Your work stays.</p>
                <h2 id="how-title">
                  Save now.
                  <br />
                  <em>Catch up together.</em>
                </h2>
              </div>
              <p>
                After the first connected setup, your PIN opens the encrypted workspace offline. Each entry
                shows where it stands.
              </p>
            </div>
            <ol className="public-steps">
              <li>
                <span className="public-step-number">01</span>
                <h3>Write it here.</h3>
                <p>The entry is saved, encrypted, on this device. Keep working without a connection.</p>
                <span className="public-step-tag">Saved locally</span>
              </li>
              <li>
                <span className="public-step-number">02</span>
                <h3>Send it when you can.</h3>
                <p>Reconnect and sync with the hub. An interrupted transfer can be retried.</p>
                <span className="public-step-tag">Hub acknowledged</span>
              </li>
              <li>
                <span className="public-step-number">03</span>
                <h3>Keep both sides.</h3>
                <p>If two values disagree, both stay available. A person reviews the difference.</p>
                <span className="public-step-tag">Human review</span>
              </li>
            </ol>
            <a className="public-text-link" href="/about">
              Read how saving and security work <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>
        <section className="public-faq public-container" aria-labelledby="faq-title">
          <div>
            <p className="public-kicker">A few useful answers</p>
            <h2 id="faq-title">
              Before the
              <br />
              <em>first bell.</em>
            </h2>
          </div>
          <div className="public-questions">
            <details>
              <summary>What can I do without internet?</summary>
              <p>
                After the first connected setup and app download, unlock and enter records offline.
                Synchronization, new enrollment and remote administration need a connection.
              </p>
            </details>
            <details>
              <summary>What if two people change the same record?</summary>
              <p>
                Compatible entries can merge. Incompatible values appear in the conflict inbox for a person to
                review. A clock alone doesn’t decide which account is correct.
              </p>
            </details>
            <details>
              <summary>Can I use my own language?</summary>
              <p>
                The workspace supports English, Hindi and Punjabi. Switching the interface language leaves the
                original saved records unchanged. This introduction is in English.
              </p>
            </details>
            <details>
              <summary>Is this ready for a school deployment?</summary>
              <p>
                This is a hackathon prototype with fictional records. A deployment needs durable hosting,
                managed keys and a privacy and security review. The Vercel demo’s server records and sessions
                may reset on restart; keep a separately encrypted backup of work you need to retain.
              </p>
            </details>
          </div>
        </section>
        <section className="public-start public-container">
          <ShieldCheck size={30} aria-hidden="true" />
          <p className="public-kicker">Meet the working prototype</p>
          <h2>
            Keep the school day <em>moving.</em>
          </h2>
          <p>Open the demo. See what a school day without a steady signal can look like.</p>
          <a className="public-button" href="/app/today">
            Enter the workspace <ArrowRight size={18} aria-hidden="true" />
          </a>
        </section>
      </main>
      <footer className="public-footer public-container">
        <div>
          <a className="public-brand" href="/">
            <span className="public-brand-symbol" aria-hidden="true">
              s<span>·</span>
            </span>
            <strong>Smriva</strong>
          </a>
          <p>Made by team Smriva at BIOS V2.</p>
        </div>
        <nav aria-label="More information">
          <a href="/about">Sources &amp; limits</a>
          <a href="https://github.com/09Pranit/BIOS">
            View the code <ArrowRight size={14} aria-hidden="true" />
          </a>
          <a href="/app/today">Workspace</a>
        </nav>
        <span className="public-footer-note">
          A prototype for education. All example records are fictional.
        </span>
      </footer>
    </div>
  );
}
