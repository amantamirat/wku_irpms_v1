 'use client';

import { useCallback, useRef, useState } from 'react';

import { User } from '../models/user.model';
import { UserApi } from '../api/user.api';
import { RoleApi } from '@/app/(main)/roles/api/role.api';
import { Role } from '@/app/(main)/roles/models/role.model';
import { useToast } from '@/contexts/ToastContext';

type Patch = (id: string, patch: Partial<User>) => void;
type Replace = (user: User) => void;

export function useUserRoleUpdater(
    patch: Patch,
    replace: Replace
) {
    const toast = useToast();

    const [visible, setVisible] = useState(false);
    const [target, setTarget] = useState<User | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const rolesLoaded = useRef(false);

    const open = useCallback(async (user: User) => {
        setTarget(user);
        setError(null);
        setVisible(true);

        if (rolesLoaded.current) return;

        setLoading(true);

        try {
            const data = await RoleApi.getAll();

            setRoles(data);
            rolesLoaded.current = true;
        } catch (err: any) {
            setError(err?.message || 'Failed to load roles.');
        } finally {
            setLoading(false);
        }
    }, []);

    const close = useCallback(() => {
        if (saving) return;
        setVisible(false);
        setTarget(null);
        setError(null);
    }, [saving]);

    const save = useCallback(async (roleIds: string[]) => {
        if (!target?._id) return;

        setSaving(true);
        setError(null);

        try {
            const updated = await UserApi.updateRoles(
                target._id,
                roleIds
            );

            // Prefer the complete returned user when available.
            replace({
                ...updated,
                workspace: updated.workspace ?? target.workspace
            });

            // Keep a small patch helper available for partial updates.
            patch(target._id, {
                roles: updated.roles
            });

            toast.success('User roles updated successfully');

            setVisible(false);
            setTarget(null);
        } catch (err: any) {
            const message =
                err?.message || 'Failed to update user roles.';

            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    }, [target, patch, replace, toast]);

    return {
        open,
        dialogProps: {
            visible,
            item: target,
            roles,
            onHide: close,
            onSave: save,
            saving,
            loading,
            canReadRoles: true,
            errorMessage: error
        }
    };
}