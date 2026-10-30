
'use client';

import { useCallback, useRef, useState } from 'react';

import { Application } from '../models/application.model';
import { ApplicationApi } from '../api/application.api';
import { UserApi } from '@/app/(main)/users/api/user.api';
import { useToast } from '@/contexts/ToastContext';

type Patch = (id: string, changes: Partial<Application>) => void;

export function useReviewerAssigner(patch: Patch) {
    const toast = useToast();

    const [visible, setVisible] = useState(false);
    const [target, setTarget] = useState<Application | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const usersLoaded = useRef(false);

    const open = useCallback(async (application: Application) => {
        const current = application.reviewerAssigner as any;

        setTarget(application);
        setSelectedUserId(
            (typeof current === 'object' ? current?._id : current) || null
        );
        setError(null);
        setVisible(true);

        if (usersLoaded.current) return;

        setLoading(true);

        try {
            const data = await UserApi.getEligibleApplicationAssignees!();

            setUsers(Array.isArray(data) ? data : []);
            usersLoaded.current = true;
        } catch (err: any) {
            const message = err?.message || 'Failed to load users.';

            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const close = useCallback(() => {
        if (saving) return;

        setVisible(false);
        setTarget(null);
        setError(null);
    }, [saving]);

    const save = useCallback(async () => {
        if (!target?._id) return;

        setSaving(true);
        setError(null);

        try {
            const updated = await ApplicationApi.updateReviewerAssigner(
                target._id,
                selectedUserId
            );

            patch(target._id, {
                reviewerAssigner: updated.reviewerAssigner
            });

            toast.success('Reviewer assigned successfully');

            setVisible(false);
            setTarget(null);
        } catch (err: any) {
            const message =
                err?.message || 'Failed to update reviewer assigner.';

            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    }, [target, selectedUserId, patch, toast]);

    return {
        open,
        dialogProps: {
            visible,
            onHide: close,
            users,
            selectedUserId,
            setSelectedUserId,
            onSave: save,
            saving,
            loading,
            errorMessage: error
        }
    };
}
