import { useEffect, useState } from 'react';
import type { BootstrapState } from '@obt/application';
import { Onboarding } from '../features/onboarding/Onboarding';
import { AppShell } from '../features/shell/AppShell';

export function App() {
  const [state, setState] = useState<BootstrapState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const desktopApi = window.obTracker;
    if (!desktopApi) {
      setError('Desktop bridge unavailable. Open OB-Tracker through Electron.');
      return;
    }

    desktopApi.getBootstrapState().then(setState).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Unable to initialize OB-Tracker');
    });
  }, []);

  if (error) return <main className="fatal-screen"><h1>OB-Tracker</h1><p>{error}</p></main>;
  if (!state) return <main className="loading-screen"><div className="loading-mark">OB</div><p>Loading local workspace…</p></main>;
  if (state.needsOnboarding) return <Onboarding initialSettings={state.settings} onComplete={setState} />;
  return <AppShell state={state} />;
}
