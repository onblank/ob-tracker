import type { AppSettings } from '@obt/settings';
export interface Worker { readonly id:string; readonly displayName:string; readonly companyName:string|null; readonly createdAt:string; readonly updatedAt:string; }
export interface WorkerRepository { getLocal(): Worker|null; create(input: Worker): void; }
export interface SettingsRepository { get(): AppSettings; update(settings: AppSettings): void; }
export interface Clock { now(): Date; monotonicMilliseconds(): number; }
export interface IdGenerator { generate(): string; }
export interface UnitOfWork { transaction<T>(work:()=>T): T; }
