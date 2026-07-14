export function getPetUpdateLabels(
  updateInput: Record<string, unknown>,
  currentPet?: Record<string, unknown>
): string[];

export function buildPetUpdateNotificationMessage(input: {
  ownerName: string;
  petName: string;
  updatedLabels: string[];
}): string;
