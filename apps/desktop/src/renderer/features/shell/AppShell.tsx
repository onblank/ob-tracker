import { useEffect, useState } from 'react';
import type { BootstrapState, TrackerState } from '@obt/application';
import obTrackerLogo from '../../assets/brand/ob-tracker-logo.svg';
import poweredByOnBlank from '../../assets/brand/powered-by-onblank.svg';
import {
  ClientsView,
  DashboardView,
  ProjectsView,
  TimeEntriesView,
  TimerView,
} from '../tracking/TrackingViews';

const NAVIGATION = [
  'Dashboard',
  'Timer',
  'Time Entries',
  'Clients',
  'Projects',
  'Tasks',
  'Reports',
  'Import / Export',
  'Backups',
  'Settings',
  'About',
] as const;

export function AppShell({ state }: { state: BootstrapState }) {
  const [active, setActive] = useState<(typeof NAVIGATION)[number]>('Dashboard');
  const [tracker, setTracker] = useState<TrackerState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.obTracker
      .getTrackerState()
      .then(setTracker)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Unable to load local tracker data.');
      });
  }, []);

  async function mutate(operation: () => Promise<TrackerState>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      setTracker(await operation());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update local tracker data.');
    } finally {
      setBusy(false);
    }
  }

  function content() {
    if (!tracker)
      return (
        <section className="feature-placeholder">
          <span className="eyebrow">LOCAL DATABASE</span>
          <h2>Loading workspace…</h2>
        </section>
      );
    if (active === 'Dashboard')
      return <DashboardView tracker={tracker} onOpenTimer={() => setActive('Timer')} />;
    if (active === 'Clients')
      return (
        <ClientsView
          tracker={tracker}
          busy={busy}
          onCreate={(input) => mutate(() => window.obTracker.createClient(input))}
        />
      );
    if (active === 'Projects')
      return (
        <ProjectsView
          tracker={tracker}
          busy={busy}
          onCreate={(input) => mutate(() => window.obTracker.createProject(input))}
        />
      );
    if (active === 'Timer')
      return (
        <TimerView
          tracker={tracker}
          busy={busy}
          onStart={(input) => mutate(() => window.obTracker.startTimer(input))}
          onStop={() => mutate(() => window.obTracker.stopTimer())}
          onOpenProjects={() => setActive('Projects')}
        />
      );
    if (active === 'Time Entries') return <TimeEntriesView tracker={tracker} />;
    return <FeaturePlaceholder title={active} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <img className="brand-logo brand-logo--sidebar" src={obTrackerLogo} alt="OB-Tracker" />
        <nav aria-label="Primary">
          {NAVIGATION.map((item) => (
            <button
              key={item}
              className={active === item ? 'nav-item active' : 'nav-item'}
              onClick={() => setActive(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-profile">
          <strong>{state.worker?.displayName}</strong>
          <span>{state.worker?.companyName ?? 'Personal workspace'}</span>
        </div>
        <img
          className="brand-logo brand-logo--powered"
          src={poweredByOnBlank}
          alt="Powered by onBlank"
        />
      </aside>
      <main className="workspace">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">OB-TRACKER</span>
            <h1>{active}</h1>
          </div>
          <button className="quick-timer" type="button" onClick={() => setActive('Timer')}>
            {tracker?.activeEntry ? '● Timer running' : '＋ Start timer'}
          </button>
        </header>
        {error && (
          <p className="form-error workspace-error" role="alert">
            {error}
          </p>
        )}
        {content()}
      </main>
    </div>
  );
}

function FeaturePlaceholder({ title }: { title: string }) {
  return (
    <section className="feature-placeholder">
      <span className="eyebrow">FOUNDATION READY</span>
      <h2>{title}</h2>
      <p>
        This feature boundary is scaffolded and ready for implementation without changing the
        repository architecture.
      </p>
    </section>
  );
}
