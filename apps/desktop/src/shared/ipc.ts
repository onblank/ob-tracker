import type {
  BootstrapState,
  CompleteOnboardingInput,
  CreateClientInput,
  CreateProjectInput,
  StartTimerInput,
  TrackerState,
} from '@obt/application';

export const IPC = {
  bootstrapGet: 'bootstrap:get',
  onboardingComplete: 'onboarding:complete',
  trackerGet: 'tracker:get',
  clientCreate: 'client:create',
  projectCreate: 'project:create',
  timerStart: 'timer:start',
  timerStop: 'timer:stop',
  windowHide: 'window:hide',
} as const;

export interface ObTrackerDesktopApi {
  getBootstrapState(): Promise<BootstrapState>;
  completeOnboarding(input: CompleteOnboardingInput): Promise<BootstrapState>;
  getTrackerState(): Promise<TrackerState>;
  createClient(input: CreateClientInput): Promise<TrackerState>;
  createProject(input: CreateProjectInput): Promise<TrackerState>;
  startTimer(input: StartTimerInput): Promise<TrackerState>;
  stopTimer(): Promise<TrackerState>;
  hideWindow(): Promise<void>;
}
