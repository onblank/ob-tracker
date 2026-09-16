import type { WorkType } from './types';
export function resolveWorkType(input: {client: WorkType; project?: WorkType | null; task?: WorkType | null;}): WorkType {
  return input.task ?? input.project ?? input.client;
}
