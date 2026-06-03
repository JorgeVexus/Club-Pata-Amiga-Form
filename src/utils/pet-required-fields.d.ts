export interface NormalizedPetWriteInput {
  name: string;
  petType: string;
  ageValue: number;
  ageUnit: string;
  gender: string;
  breed: string;
  isMixed: boolean;
  coatColor: string;
}

export type MissingPetField =
  | 'name'
  | 'petType'
  | 'age'
  | 'gender'
  | 'breed'
  | 'coatColor';

export function normalizePetWriteInput(input?: Record<string, unknown>): NormalizedPetWriteInput;
export function hasValidBasicPetFields(input?: Record<string, unknown>): boolean;
export function getMissingCompletePetFields(input?: Record<string, unknown>): MissingPetField[];
export function hasCompleteRequiredPetFields(input?: Record<string, unknown>): boolean;
