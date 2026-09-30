import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { TrackerState } from '@obt/application';

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function useActiveDuration(startedAt: string | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [startedAt]);
  return startedAt ? Math.max(0, (now - new Date(startedAt).getTime()) / 1_000) : 0;
}

export function DashboardView({
  tracker,
  onOpenTimer,
}: {
  tracker: TrackerState;
  onOpenTimer(): void;
}) {
  const activeSeconds = useActiveDuration(tracker.activeEntry?.startedAt ?? null);
  const active = tracker.activeEntry;
  const totals = tracker.todayTotals;
  return (
    <>
      <section className="hero-card">
        <div>
          <span className="eyebrow">TODAY</span>
          <h2>{active ? `${active.clientName} · ${active.projectName}` : 'Ready when you are.'}</h2>
          <p>
            {active?.note ||
              (active
                ? 'Timer running locally on this computer.'
                : 'Create a client and project, then record your first session.')}
          </p>
          {!active && (
            <button className="hero-action" type="button" onClick={onOpenTimer}>
              Start tracking
            </button>
          )}
        </div>
        <div className="hero-clock">{active ? formatDuration(activeSeconds) : '00:00:00'}</div>
      </section>
      <section className="kpi-grid">
        {[
          ['Tracked', totals.trackedSeconds],
          ['Billable', totals.billableSeconds],
          ['Non-billable', totals.nonBillableSeconds],
          ['Learning', totals.learningSeconds],
        ].map(([label, seconds]) => (
          <article className="kpi-card" key={label}>
            <span>{label}</span>
            <strong>{formatDuration(Number(seconds))}</strong>
          </article>
        ))}
      </section>
      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TODAY</span>
            <h3>Recent entries</h3>
          </div>
        </div>
        <EntryList entries={tracker.todayEntries.slice(0, 5)} />
      </section>
    </>
  );
}

export function ClientsView({
  tracker,
  busy,
  onCreate,
}: {
  tracker: TrackerState;
  busy: boolean;
  onCreate(input: { name: string; description: string }): Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onCreate({ name, description });
    setName('');
    setDescription('');
  }
  return (
    <div className="split-view">
      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">WORKSPACE</span>
            <h2>Clients</h2>
          </div>
          <span className="count-badge">{tracker.clients.length}</span>
        </div>
        {tracker.clients.length === 0 ? (
          <EmptyState
            title="No clients yet"
            text="Create the first client to organize projects and time entries."
          />
        ) : (
          <div className="entity-list">
            {tracker.clients.map((client) => (
              <article className="entity-row" key={client.id}>
                <span className="entity-dot" />
                <div>
                  <strong>{client.name}</strong>
                  <p>{client.description || `${client.workType.replace('_', '-')} work`}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <form
        className="side-form"
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <span className="eyebrow">NEW CLIENT</span>
        <h2>Create a client</h2>
        <p>Defaults from onboarding are applied locally.</p>
        <label>
          Name
          <input
            required
            maxLength={180}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Acme Studio"
          />
        </label>
        <label>
          Description <small>(optional)</small>
          <input
            maxLength={2000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Website redesign"
          />
        </label>
        <button className="primary-button" disabled={busy} type="submit">
          {busy ? 'Saving…' : 'Create client'}
        </button>
      </form>
    </div>
  );
}

export function ProjectsView({
  tracker,
  busy,
  onCreate,
}: {
  tracker: TrackerState;
  busy: boolean;
  onCreate(input: { clientId: string; name: string; description: string }): Promise<void>;
}) {
  const [clientId, setClientId] = useState(tracker.clients[0]?.id ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const clientsById = useMemo(
    () => new Map(tracker.clients.map((client) => [client.id, client])),
    [tracker.clients],
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onCreate({ clientId, name, description });
    setName('');
    setDescription('');
  }
  return (
    <div className="split-view">
      <section className="data-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">WORKSPACE</span>
            <h2>Projects</h2>
          </div>
          <span className="count-badge">{tracker.projects.length}</span>
        </div>
        {tracker.projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            text="Every timer needs a project belonging to a client."
          />
        ) : (
          <div className="entity-list">
            {tracker.projects.map((project) => (
              <article className="entity-row" key={project.id}>
                <span className={`status-dot status-${project.status}`} />
                <div>
                  <strong>{project.name}</strong>
                  <p>
                    {clientsById.get(project.clientId)?.name} · {project.status.replace('_', ' ')}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <form
        className="side-form"
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <span className="eyebrow">NEW PROJECT</span>
        <h2>Create a project</h2>
        <p>Projects are the minimum tracking target in OB-Tracker.</p>
        {tracker.clients.length === 0 ? (
          <EmptyState
            title="Create a client first"
            text="A project cannot exist without a client."
          />
        ) : (
          <>
            <label>
              Client
              <select
                required
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
              >
                {tracker.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Name
              <input
                required
                maxLength={180}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Launch campaign"
              />
            </label>
            <label>
              Description <small>(optional)</small>
              <input
                maxLength={2000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Initial scope"
              />
            </label>
            <button className="primary-button" disabled={busy || !clientId} type="submit">
              {busy ? 'Saving…' : 'Create project'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export function TimerView({
  tracker,
  busy,
  onStart,
  onStop,
  onOpenProjects,
}: {
  tracker: TrackerState;
  busy: boolean;
  onStart(input: { projectId: string; note: string }): Promise<void>;
  onStop(): Promise<void>;
  onOpenProjects(): void;
}) {
  const availableProjects = tracker.projects.filter((project) => project.status !== 'completed');
  const [projectId, setProjectId] = useState(availableProjects[0]?.id ?? '');
  const [note, setNote] = useState('');
  const activeSeconds = useActiveDuration(tracker.activeEntry?.startedAt ?? null);
  const clientsById = useMemo(
    () => new Map(tracker.clients.map((client) => [client.id, client])),
    [tracker.clients],
  );
  if (tracker.activeEntry)
    return (
      <section className="timer-panel active-timer">
        <span className="eyebrow">TRACKING NOW</span>
        <div className="timer-display">{formatDuration(activeSeconds)}</div>
        <h2>{tracker.activeEntry.projectName}</h2>
        <p>
          {tracker.activeEntry.clientName}
          {tracker.activeEntry.note ? ` · ${tracker.activeEntry.note}` : ''}
        </p>
        <button
          className="stop-button"
          disabled={busy}
          type="button"
          onClick={() => {
            void onStop();
          }}
        >
          {busy ? 'Stopping…' : '■ Stop timer'}
        </button>
      </section>
    );
  if (availableProjects.length === 0)
    return (
      <section className="timer-panel">
        <EmptyState
          title="A project is required"
          text="Create a client and project before starting your first timer."
        />
        <button className="primary-button" type="button" onClick={onOpenProjects}>
          Open projects
        </button>
      </section>
    );
  async function submit(event: FormEvent) {
    event.preventDefault();
    await onStart({ projectId, note });
    setNote('');
  }
  return (
    <form
      className="timer-panel"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <span className="eyebrow">NEW SESSION</span>
      <div className="timer-display muted">00:00:00</div>
      <h2>What are you working on?</h2>
      <label>
        Project
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
          {availableProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {clientsById.get(project.clientId)?.name} · {project.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Note <small>(optional)</small>
        <input
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What will you accomplish?"
        />
      </label>
      <button className="start-button" disabled={busy || !projectId} type="submit">
        {busy ? 'Starting…' : '▶ Start timer'}
      </button>
    </form>
  );
}

export function TimeEntriesView({ tracker }: { tracker: TrackerState }) {
  return (
    <section className="data-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">TODAY</span>
          <h2>Time entries</h2>
        </div>
        <strong>{formatDuration(tracker.todayTotals.trackedSeconds)}</strong>
      </div>
      <EntryList entries={tracker.todayEntries} />
    </section>
  );
}

function EntryList({ entries }: { entries: TrackerState['todayEntries'] }) {
  if (entries.length === 0)
    return (
      <EmptyState title="No time recorded today" text="Completed sessions will appear here." />
    );
  return (
    <div className="entry-list">
      {entries.map((entry) => (
        <article className="entry-row" key={entry.id}>
          <div>
            <strong>{entry.projectName}</strong>
            <p>
              {entry.clientName}
              {entry.note ? ` · ${entry.note}` : ''}
            </p>
          </div>
          <div className="entry-meta">
            <strong>{formatDuration(entry.rawDurationSeconds ?? 0)}</strong>
            <span>
              {new Date(entry.startedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="inline-empty">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
