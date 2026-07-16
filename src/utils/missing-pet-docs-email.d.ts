export type MissingDocType = 'photo' | 'certificate' | 'both';
export type FollowupDay = 0 | 10 | 13 | 14 | 15;

export interface MissingPetDocsEmailParams {
    userName: string;
    petName: string;
    petIndex: number;
    missingDocs: MissingDocType;
    followupDay: FollowupDay;
    uploadUrl: string;
}

export const IMAGE_PLACEHOLDERS: Readonly<Record<'hero' | 'pack' | 'logo' | 'photoIcon' | 'certificateIcon', string>>;
export function getMissingDocsSubject(petName: string, day: FollowupDay, missing: MissingDocType): string;
export function getMissingDocsMessage(petName: string, userName: string, day: FollowupDay, missing: MissingDocType): { headline: string; body: string };
export function buildMissingDocsEmailHtml(params: MissingPetDocsEmailParams): string;
