import type { FollowupDay, MissingDocType } from './missing-pet-docs-email';

export interface MissingDocsTestInput {
    recipientEmail: string;
    userName: string;
    petName: string;
    followupDay: FollowupDay;
    missingDocs: MissingDocType;
    uploadUrl: string;
}

export interface MissingDocsTestContent extends MissingDocsTestInput {
    subject: string;
    html: string;
    text: string;
}

export const FOLLOWUP_DAYS: readonly FollowupDay[];
export const MISSING_DOC_TYPES: readonly MissingDocType[];
export function validateMissingDocsTestInput(input: unknown): MissingDocsTestInput;
export function buildMissingDocsTestContent(input: unknown): MissingDocsTestContent;

