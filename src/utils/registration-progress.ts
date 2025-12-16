/**
 * Registration Progress Tracker
 * Manages multi-step form progress using localStorage
 */

export interface RegistrationProgress {
    step1Complete: boolean;
    step2Complete: boolean;
    step3Complete: boolean;
    step1Data?: any;
    step2Data?: any;
    currentStep: number;
    lastUpdated: string;
}

const STORAGE_KEY = 'registration_progress';

export const getRegistrationProgress = (): RegistrationProgress => {
    if (typeof window === 'undefined') {
        return {
            step1Complete: false,
            step2Complete: false,
            step3Complete: false,
            currentStep: 1,
            lastUpdated: new Date().toISOString()
        };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return {
            step1Complete: false,
            step2Complete: false,
            step3Complete: false,
            currentStep: 1,
            lastUpdated: new Date().toISOString()
        };
    }

    try {
        return JSON.parse(stored);
    } catch {
        return {
            step1Complete: false,
            step2Complete: false,
            step3Complete: false,
            currentStep: 1,
            lastUpdated: new Date().toISOString()
        };
    }
};

export const updateRegistrationProgress = (updates: Partial<RegistrationProgress>) => {
    const current = getRegistrationProgress();
    const updated = {
        ...current,
        ...updates,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
};

export const markStepComplete = (step: 1 | 2 | 3, data?: any) => {
    const updates: Partial<RegistrationProgress> = {
        lastUpdated: new Date().toISOString()
    };

    if (step === 1) {
        updates.step1Complete = true;
        updates.step1Data = data;
        updates.currentStep = 2;
    } else if (step === 2) {
        updates.step2Complete = true;
        updates.step2Data = data;
        updates.currentStep = 3;
    } else if (step === 3) {
        updates.step3Complete = true;
    }

    return updateRegistrationProgress(updates);
};

export const resetRegistrationProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const canAccessStep = (step: 1 | 2 | 3): boolean => {
    const progress = getRegistrationProgress();

    if (step === 1) return true; // Siempre puede acceder a paso 1
    if (step === 2) return progress.step1Complete;
    if (step === 3) return progress.step1Complete && progress.step2Complete;

    return false;
};

export const getCompletedSteps = (): number[] => {
    const progress = getRegistrationProgress();
    const completed: number[] = [];

    if (progress.step1Complete) completed.push(1);
    if (progress.step2Complete) completed.push(2);
    if (progress.step3Complete) completed.push(3);

    return completed;
};
