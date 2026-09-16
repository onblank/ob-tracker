import { z } from 'zod';
import type { Clock, IdGenerator, SettingsRepository, UnitOfWork, Worker, WorkerRepository } from '@obt/contracts';
import { settingsSchema, type AppSettings } from '@obt/settings';

export interface BootstrapState { readonly needsOnboarding:boolean; readonly worker:Worker|null; readonly settings:AppSettings; }

export class GetBootstrapState {
  public constructor(private readonly workers:WorkerRepository, private readonly settings:SettingsRepository) {}
  public execute(): BootstrapState {
    const worker=this.workers.getLocal();
    return { needsOnboarding:worker===null, worker, settings:this.settings.get() };
  }
}

const onboardingInputSchema=z.object({
  displayName:z.string().trim().min(1).max(120),
  companyName:z.string().trim().max(160).nullable(),
  language:z.string().min(1),
  currencyCode:z.string().regex(/^[A-Z]{3}$/),
  defaultWorkType:z.enum(['billable','non_billable','learning']),
  defaultBillingModel:z.enum(['none','hourly']),
  defaultHourlyRateMinor:z.number().int().nonnegative().nullable()
});
export type CompleteOnboardingInput=z.infer<typeof onboardingInputSchema>;

export class CompleteOnboarding {
  public constructor(
    private readonly workers:WorkerRepository,
    private readonly settings:SettingsRepository,
    private readonly unitOfWork:UnitOfWork,
    private readonly clock:Clock,
    private readonly ids:IdGenerator
  ) {}
  public execute(rawInput:CompleteOnboardingInput): BootstrapState {
    const input=onboardingInputSchema.parse({...rawInput,companyName:rawInput.companyName?.trim()||null});
    if (this.workers.getLocal()) throw new Error('Onboarding has already been completed for this installation.');
    const now=this.clock.now().toISOString();
    return this.unitOfWork.transaction(()=>{
      const worker:Worker={id:this.ids.generate(),displayName:input.displayName,companyName:input.companyName,createdAt:now,updatedAt:now};
      this.workers.create(worker);
      const updatedSettings=settingsSchema.parse({...this.settings.get(),language:input.language,defaultCurrencyCode:input.currencyCode,defaultWorkType:input.defaultWorkType,defaultBillingModel:input.defaultBillingModel,defaultHourlyRateMinor:input.defaultHourlyRateMinor});
      this.settings.update(updatedSettings);
      return {needsOnboarding:false,worker,settings:updatedSettings};
    });
  }
}
