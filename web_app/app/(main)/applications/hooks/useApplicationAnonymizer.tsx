
'use client';

import { useCallback, useState } from 'react';

import { Application } from '../models/application.model';
import { ApplicationApi } from '../api/application.api';
import { useToast } from '@/contexts/ToastContext';

type Patch = (id: string, changes: Partial<Application>) => void;

export function useApplicationAnonymizer(patch: Patch) {
    const toast = useToast();

    const [visible, setVisible] = useState(false);
    const [target, setTarget] = useState<Application | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const open = useCallback((application: Application) => {
        setTarget(application);
        setError(null);
        setVisible(true);
    }, []);

    const close = useCallback(() => {
        if (saving) return;

        setVisible(false);
        setTarget(null);
        setError(null);
    }, [saving]);

    const anonymize = useCallback(
        async (manualIdentifiers: string[]) => {
            if (!target?._id) return;

            setSaving(true);
            setError(null);

            try {
                const updated = await ApplicationApi.anonymize(
                    target._id,
                    manualIdentifiers
                );

                patch(target._id, updated);

                toast.success('Application anonymized successfully');

                setVisible(false);
                setTarget(null);
            } catch (err: any) {
                const message =
                    err?.message ||
                    'Failed to anonymize the application document.';

                setError(message);
                toast.error(message);
            } finally {
                setSaving(false);
            }
        },
        [target, patch, toast]
    );

    return {
        open,
        dialogProps: {
            visible,
            onHide: close,
            identifiers: target?.manualIdentifiers ?? [],
            onAnonymize: anonymize,
            saving,
            errorMessage: error
        }
    };
}
