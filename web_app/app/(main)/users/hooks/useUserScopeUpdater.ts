 'use client';

import { useCallback, useEffect, useState } from 'react';

import { User } from '../models/user.model';
import { UserApi } from '../api/user.api';

import {
    Organization,
    OrgnUnit
} from '@/app/(main)/organizations/models/organization.model';

import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { useToast } from '@/contexts/ToastContext';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';
import { Scope } from '../components/dialogs/ScopeDialog';



type Replace = (user: User) => void;

export function useUserScopeUpdater(replace: Replace) {
    const toast = useToast();
    const confirm = useConfirmDialog();

    const [visible, setVisible] = useState(false);
    const [target, setTarget] = useState<User | null>(null);
    const [organizations, setOrganizations] =
        useState<Organization[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const open = useCallback((user: User) => {
        setTarget(user);
        setError(null);
        setVisible(true);
    }, []);

    useEffect(() => {
        if (!visible) return;

        let cancelled = false;

        const loadOrganizations = async () => {
            setLoading(true);
            setError(null);

            try {
                const [departments, directorates, externals] =
                    await Promise.all([
                        OrganizationApi.lookup!({
                            type: OrgnUnit.department
                        }),
                        OrganizationApi.lookup!({
                            type: OrgnUnit.directorate
                        }),
                        OrganizationApi.lookup!({
                            type: OrgnUnit.external
                        })
                    ]);

                if (cancelled) return;

                const unique = new Map<string, Organization>();

                [...departments, ...directorates, ...externals]
                    .forEach(organization => {
                        unique.set(
                            String(organization._id),
                            organization
                        );
                    });

                setOrganizations([...unique.values()]);
            } catch (err: any) {
                if (!cancelled) {
                    setError(
                        err?.message ||
                        'Failed to load organizations.'
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadOrganizations();

        return () => {
            cancelled = true;
        };
    }, [visible]);

    const close = useCallback(() => {
        if (saving) return;

        setVisible(false);
        setTarget(null);
        setError(null);
    }, [saving]);

    const save = useCallback(async (scope: Scope) => {
        if (!target?._id) return;

        setSaving(true);
        setError(null);

        try {
            const updated = await UserApi.updateScope(
                target._id,
                scope
            );

            replace({
                ...updated,
                workspace: updated.workspace ?? target.workspace
            });

            toast.success('User scope updated successfully');

            setVisible(false);
            setTarget(null);
        } catch (err: any) {
            const message =
                err?.message || 'Failed to update user scope.';

            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    }, [target, replace, toast]);

    const clearScope = useCallback(() => {
        if (!target) return;

        confirm.ask({
            operation: 'Clear scope',
            item: target.name,
            onConfirm: () => {
                void save(null);
            }
        });
    }, [target, confirm, save]);

    return {
        open,
        dialogProps: {
            visible,
            scope: target?.scope ?? null,
            organizations,
            onHide: close,
            onSave: save,
            onClearScope: clearScope,
            saving,
            loading,
            errorMessage: error
        }
    };
}