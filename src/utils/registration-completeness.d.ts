export interface NormalizedPetBasic {
  petName: string;
  petType: string;
  petAge: number;
  petAgeUnit: 'years' | 'months';
}

export interface ClampRegistrationStepInput {
  requestedStep?: number;
  computedStep?: number;
  hasValidPetBasic: boolean;
  hasPetsInDb: boolean;
  paymentCompleted: boolean;
  finishOnboarding: boolean;
  petRecovery?: boolean;
}

export type RegistrationIssue =
  | 'paid_without_pets'
  | 'paid_without_complete_pet_rows'
  | null;

export function normalizePetBasicList(value: unknown): NormalizedPetBasic[];
export function hasValidPetBasic(value: unknown): boolean;
export function clampRequestedRegistrationStep(input: ClampRegistrationStepInput): number;
export function getRegistrationIssue(input: {
  hasActivePlan: boolean;
  petCount: number;
  hasValidPetBasic: boolean;
}): RegistrationIssue;
