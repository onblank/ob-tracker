import { useState } from 'react';
import type { BootstrapState } from '@obt/application';
import obTrackerLogo from '../../assets/brand/ob-tracker-logo.svg';
import poweredByOnBlank from '../../assets/brand/powered-by-onblank.svg';

const NAVIGATION = ['Dashboard','Timer','Time Entries','Clients','Projects','Tasks','Reports','Import / Export','Backups','Settings','About'] as const;

export function AppShell({ state }: { state: BootstrapState }) {
  const [active, setActive] = useState<(typeof NAVIGATION)[number]>('Dashboard');
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <img className="brand-logo brand-logo--sidebar" src={obTrackerLogo} alt="OB-Tracker" />
        <nav aria-label="Primary">
          {NAVIGATION.map((item) => <button key={item} className={active === item ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item)}>{item}</button>)}
        </nav>
        <div className="sidebar-profile"><strong>{state.worker?.displayName}</strong><span>{state.worker?.companyName ?? 'Personal workspace'}</span></div>
        <img className="brand-logo brand-logo--powered" src={poweredByOnBlank} alt="Powered by onBlank" />
      </aside>
      <main className="workspace">
        <header className="workspace-header"><div><span className="eyebrow">OB-TRACKER</span><h1>{active}</h1></div><button className="quick-timer" type="button">＋ Start timer</button></header>
        {active === 'Dashboard' ? <DashboardPlaceholder /> : <FeaturePlaceholder title={active} />}
      </main>
    </div>
  );
}

function DashboardPlaceholder() {
  return <>
    <section className="hero-card"><div><span className="eyebrow">TODAY</span><h2>Ready when you are.</h2><p>Your timer, reporting and billing data will stay local to this computer.</p></div><div className="hero-clock">00:00:00</div></section>
    <section className="kpi-grid">
      {['Tracked','Billable','Non-billable','Learning'].map((label) => <article className="kpi-card" key={label}><span>{label}</span><strong>0h 00m</strong></article>)}
    </section>
    <section className="empty-chart"><div><span className="eyebrow">THIS WEEK</span><h3>Time distribution</h3></div><div className="chart-placeholder"><span>Start tracking to build your first chart.</span></div></section>
  </>;
}

function FeaturePlaceholder({ title }: { title: string }) {
  return <section className="feature-placeholder"><span className="eyebrow">FOUNDATION READY</span><h2>{title}</h2><p>This feature boundary is scaffolded and ready for implementation without changing the repository architecture.</p></section>;
}
