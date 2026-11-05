import { useEffect, useRef, useState } from 'react';
import { Check, Pause, Play, Wifi, WifiOff } from 'lucide-react';
import type { RecordScene } from './record-scene';

export default function RecordNetwork() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<RecordScene | null>(null);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const element = host.current!;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let loading = false;
    let visible = false;
    setInteractive(true);
    const updateMotion = () => setReducedMotion(motion.matches);
    updateMotion();
    motion.addEventListener('change', updateMotion);
    const observer = new IntersectionObserver(async ([entry]) => {
      visible = entry.isIntersecting;
      scene.current?.setVisible(entry.isIntersecting);
      if (!entry.isIntersecting || loading) return;
      if ('connection' in navigator && (navigator.connection as { saveData?: boolean }).saveData) return;
      loading = true;
      try {
        const { createRecordScene } = await import('./record-scene');
        if (disposed) return;
        scene.current = createRecordScene(element, () => setReady(false));
        scene.current.setVisible(visible);
        setReady(true);
      } catch {
        // The HTML illustration remains usable without WebGL or the optional download.
        setReady(false);
      }
    });
    observer.observe(element);
    return () => {
      disposed = true;
      observer.disconnect();
      motion.removeEventListener('change', updateMotion);
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    scene.current?.setConnected(connected);
  }, [connected, ready]);
  useEffect(() => {
    scene.current?.setPaused(paused || reducedMotion);
  }, [paused, reducedMotion, ready]);

  return (
    <figure
      className={`public-network ${ready ? 'scene-ready' : ''} ${interactive ? 'network-interactive' : ''}`}
    >
      <figcaption className="public-network-heading">
        <span>One community. A shared record.</span>
        <span className="public-network-index">01—03</span>
      </figcaption>
      <div className="public-network-viewport" ref={host} aria-hidden="true">
        <div className="public-network-fallback">
          <span />
          <span />
          <span />
          <div className="public-fallback-book">
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
      <span className="public-network-label label-school">
        School register<span>Saved on device</span>
      </span>
      <span className="public-network-label label-hub">
        Community hub<span>{connected ? 'Connection available' : 'Ready when you are'}</span>
      </span>
      <div className="public-network-receipt">
        <span className="public-receipt-icon">
          <Check size={17} aria-hidden="true" />
        </span>
        <div>
          <strong>{connected ? 'Catching up together.' : 'The school day goes on.'}</strong>
          <span>
            {connected ? 'Example: entries travel to the hub.' : 'Example: entries stay on your device.'}
          </span>
        </div>
      </div>
      <div className="public-network-controls">
        <div role="group" aria-label="Illustration connection mode">
          <button type="button" aria-pressed={!connected} onClick={() => setConnected(false)}>
            <WifiOff size={14} aria-hidden="true" /> Offline
          </button>
          <button type="button" aria-pressed={connected} onClick={() => setConnected(true)}>
            <Wifi size={14} aria-hidden="true" /> Connected
          </button>
        </div>
        {ready && !reducedMotion && (
          <button
            className="public-motion-button"
            type="button"
            aria-label={paused ? 'Play illustration' : 'Pause illustration'}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
          </button>
        )}
      </div>
      <p className="public-network-caption" role="status">
        Interactive illustration · {connected ? 'connected mode' : 'offline mode'}
      </p>
    </figure>
  );
}
