export function maskReferredName(fullName: string | null | undefined): string {
    const words = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'R*****';
    return words.map((word) => `${Array.from(word)[0].toUpperCase()}*****`).join(' ');
}
