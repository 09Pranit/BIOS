import { registerSW } from 'virtual:pwa-register';
import './style.css';
import './public-site.css';
import './government-resources.css';
import './languages.css';
import './device-support.css';
if ('serviceWorker' in navigator && globalThis.isSecureContext !== false) {
  registerSW({
    immediate: true,
    onRegisterError: () => {
      document.documentElement.dataset.offlineShell = 'unavailable';
      window.dispatchEvent(new Event('smriva-offline-status'));
    },
  });
}
async function start() {
  const root = document.getElementById('root')!;
  try {
    const theme =
      localStorage.getItem('smriva-theme') ??
      localStorage.getItem('setusync-theme') ??
      localStorage.getItem('kuka-theme');
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
  } catch {}
  // Keep the public illustration independent of the encrypted workspace bundle.
  if (location.pathname === '/') {
    await import('./landing-main');
    return;
  }
  await import('./workspace-main');
}
void start().catch(() => {
  // No storage is cleared when an older cached asset or an interrupted download fails.
  const root = document.getElementById('root')!;
  if (root.querySelector('main')) return;
  const main = document.createElement('main');
  main.className = 'public-not-found';
  const title = document.createElement('h1');
  title.textContent = 'The workspace could not finish loading.';
  const text = document.createElement('p');
  text.textContent = 'Your saved records are unchanged. Reconnect to the hub and reload this page.';
  const reload = document.createElement('button');
  reload.className = 'button primary';
  reload.textContent = 'Reload workspace';
  reload.onclick = () => location.reload();
  main.append(title, text, reload);
  root.replaceChildren(main);
});
