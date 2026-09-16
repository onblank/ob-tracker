import type { BootstrapState, CompleteOnboardingInput } from '@obt/application';

export const IPC = {
  bootstrapGet: 'bootstrap:get',
  onboardingComplete: 'onboarding:complete',
  windowHide: 'window:hide',
} as const;

export interface ObTrackerDesktopApi {
  getBootstrapState(): Promise<BootstrapState>;
  completeOnboarding(input: CompleteOnboardingInput): Promise<BootstrapState>;
  hideWindow(): Promise<void>;
}
