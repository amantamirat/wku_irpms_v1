'use client';

import { useEffect, useRef, useState } from 'react';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { MultiSelect } from 'primereact/multiselect';

import { UserApi } from '../../api/user.api';
import { User } from '../../models/user.model';

import {
    Organization,
    OrgnUnit
} from '@/app/(main)/organizations/models/organization.model';

import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';

import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';

interface ScopeDialogProps {
    visible: boolean;
    item: User;
    onHide: () => void;
    onComplete?: (saved: User) => void;
}

type Scope = string[] | '*' | null;

const ScopeDialog = ({
    visible,
    item,
    onHide,
    onComplete
}: ScopeDialogProps) => {

    const toast = useRef<Toast>(null);
    const confirm = useConfirmDialog();

    const [scope, setScope] =
        useState<Scope>(null);

    const [organizations, setOrganizations] =
        useState<Organization[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);


    /*
     * Load all organizations that can be used
     * as authorization scope.
     */
    useEffect(() => {

        if (!visible) {
            return;
        }

        const loadOrganizations = async () => {

            setLoading(true);

            try {

                const [
                    departments,
                    directorates,
                    externals
                ] = await Promise.all([
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

                setOrganizations([
                    ...departments,
                    ...directorates,
                    ...externals
                ]);

            } catch (err: any) {

                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail:
                        err.message ||
                        'Failed to load organizations.'
                });

            } finally {

                setLoading(false);
            }
        };

        loadOrganizations();

    }, [visible]);


    /*
     * Load the user's existing scope.
     */
    useEffect(() => {

        if (!visible) {
            return;
        }

        setScope(
            item.scope ?? null
        );

    }, [visible, item]);


    /*
     * Update selected organizations.
     */
    const handleScopeChange = (
        value: string[]
    ) => {

        setScope(
            value.length
                ? value
                : null
        );
    };


    /*
     * Toggle full access.
     */
    const handleFullAccessChange = (
        checked: boolean
    ) => {

        if (checked) {
            setScope('*');
        } else {
            setScope(null);
        }
    };


    /*
     * Clear the current scope.
     */
    const handleClearScope = () => {

        confirm.ask({
            operation: "Clear scope",
            item: item.name,

            onConfirm: () => {
                setScope(null);
            }
        });
    };


    /*
     * Save scope.
     */
    const handleSave = async () => {

        if (!item._id) {
            return;
        }

        setSaving(true);

        try {

            const saved =
                await UserApi.updateScope(
                    item._id,
                    scope
                );

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail:
                    'User scope updated successfully.'
            });

            onComplete?.({
                ...saved,
                workspace: item.workspace
            });

            onHide();

        } catch (err: any) {

            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail:
                    err.message ||
                    'Failed to update user scope.'
            });

        } finally {

            setSaving(false);
        }
    };


    const isFullAccess =
        scope === '*';

    const isCleared =
        scope === null;

    const selectedOrganizations =
        Array.isArray(scope)
            ? organizations.filter(
                organization =>
                    scope.includes(
                        String(organization._id)
                    )
            )
            : [];


    return (
        <>
            <Toast ref={toast} />

            <Dialog
                header="Manage User Scope"
                visible={visible}
                onHide={onHide}
                modal
                style={{
                    width: '40rem'
                }}
                footer={
                    <div className="flex justify-content-end gap-2">

                        <Button
                            label="Cancel"
                            icon="pi pi-times"
                            severity="secondary"
                            outlined
                            onClick={onHide}
                            disabled={saving}
                        />

                        <Button
                            label="Save"
                            icon="pi pi-check"
                            onClick={handleSave}
                            loading={saving}
                        />

                    </div>
                }
            >

                <div className="flex flex-column gap-4">

                    {/* Current scope */}
                    <div>

                        <label className="block font-medium mb-2">
                            Current Scope
                        </label>

                        {isFullAccess && (
                            <Tag
                                value="Full Access"
                                severity="success"
                                icon="pi pi-globe"
                            />
                        )}

                        {!isFullAccess &&
                            selectedOrganizations.length > 0 && (
                                <div className="flex flex-wrap gap-2">

                                    {selectedOrganizations.map(
                                        organization => (
                                            <Tag
                                                key={
                                                    String(
                                                        organization._id
                                                    )
                                                }
                                                value={
                                                    organization.name
                                                }
                                                severity="info"
                                            />
                                        )
                                    )}

                                </div>
                            )}

                        {isCleared && (
                            <Tag
                                value="No Scope"
                                severity="warning"
                                icon="pi pi-ban"
                            />
                        )}

                    </div>


                    {/* Full access */}
                    <div className="flex align-items-center gap-2">

                        <Checkbox
                            inputId="fullAccess"
                            checked={isFullAccess}
                            onChange={e =>
                                handleFullAccessChange(
                                    e.checked ?? false
                                )
                            }
                        />

                        <label
                            htmlFor="fullAccess"
                            className="cursor-pointer"
                        >
                            Full Access
                        </label>

                    </div>


                    {/* Organizations */}
                    {!isFullAccess && (
                        <div>

                            <label
                                htmlFor="organizations"
                                className="block font-medium mb-2"
                            >
                                Organizations
                            </label>

                            <MultiSelect
                                id="organizations"
                                value={
                                    Array.isArray(scope)
                                        ? scope
                                        : []
                                }
                                options={organizations}
                                onChange={e =>
                                    handleScopeChange(
                                        e.value
                                    )
                                }
                                optionLabel="name"
                                optionValue="_id"
                                placeholder={
                                    loading
                                        ? 'Loading organizations...'
                                        : 'Select organizations'
                                }
                                className="w-full"
                                filter
                                display="chip"
                                // loading={loading}
                                disabled={loading}
                                emptyMessage="No organizations found."
                            />

                        </div>
                    )}


                    {/* Clear scope */}
                    {!isCleared && (
                        <div className="flex justify-content-end">

                            <Button
                                label="Clear Scope"
                                icon="pi pi-ban"
                                severity="danger"
                                text
                                onClick={handleClearScope}
                                disabled={saving}
                            />

                        </div>
                    )}

                </div>

            </Dialog>
        </>
    );
};

export default ScopeDialog;