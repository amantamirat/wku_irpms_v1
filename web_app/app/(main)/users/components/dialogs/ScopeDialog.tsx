'use client';

import { useEffect, useState } from 'react';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { MultiSelect } from 'primereact/multiselect';
import { Message } from 'primereact/message';

import {
    Organization
} from '@/app/(main)/organizations/models/organization.model';

export type Scope = string[] | '*' | null;

interface ScopeDialogProps {
    visible: boolean;
    scope: Scope;
    organizations: Organization[];
    onHide: () => void;
    onSave: (scope: Scope) => void | Promise<void>;
    onClearScope: () => void;
    saving: boolean;
    loading: boolean;
    errorMessage: string | null;
}

const ScopeDialog = ({
    visible,
    scope,
    organizations,
    onHide,
    onSave,
    onClearScope,
    saving,
    loading,
    errorMessage
}: ScopeDialogProps) => {

    const [selectedScope, setSelectedScope] =
        useState<Scope>(scope);

    // Load the current scope whenever the dialog opens.
    useEffect(() => {
        if (visible) {
            setSelectedScope(scope);
        }
    }, [visible, scope]);

    const handleFullAccessChange = (
        checked: boolean
    ) => {
        setSelectedScope(checked ? '*' : null);
    };

    const handleOrganizationsChange = (
        value: string[]
    ) => {
        setSelectedScope(value.length ? value : null);
    };

    const handleSave = async () => {
        await onSave(selectedScope);
    };

    const isFullAccess = selectedScope === '*';
    const isCleared = selectedScope === null;

    const selectedOrganizations = Array.isArray(selectedScope)
        ? organizations.filter(organization =>
            selectedScope.includes(String(organization._id))
        )
        : [];

    return (
        <Dialog
            header="Manage User Scope"
            visible={visible}
            style={{ width: '40rem', maxWidth: '95vw' }}
            onHide={() => {
                if (!saving) onHide();
            }}
            closable={!saving}
            closeOnEscape={!saving}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        className="p-button-text p-button-sm"
                        onClick={onHide}
                        disabled={saving}
                    />

                    <Button
                        label="Save"
                        icon="pi pi-check"
                        className="p-button-sm"
                        onClick={handleSave}
                        loading={saving}
                        disabled={loading}
                    />
                </div>
            }
        >
            <div className="flex flex-column gap-4 pt-2">

                <span className="text-sm text-600">
                    Manage the organizations this user can access.
                    Select specific organizations, grant full access,
                    or clear the scope to remove access.
                </span>

                {errorMessage && (
                    <Message
                        severity="error"
                        text={errorMessage}
                        className="w-full"
                    />
                )}

                {/* Current scope */}
                <div className="flex flex-column gap-2">
                    <label className="text-sm font-semibold text-900">
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
                                {selectedOrganizations.map(organization => (
                                    <Tag
                                        key={String(organization._id)}
                                        value={organization.name}
                                        severity="info"
                                    />
                                ))}
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
                            handleFullAccessChange(e.checked ?? false)
                        }
                        disabled={saving}
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
                    <div className="flex flex-column gap-2">
                        <label
                            htmlFor="organizations"
                            className="text-sm font-semibold text-900"
                        >
                            Organizations
                        </label>

                        <MultiSelect
                            id="organizations"
                            value={
                                Array.isArray(selectedScope)
                                    ? selectedScope
                                    : []
                            }
                            options={organizations}
                            onChange={e =>
                                handleOrganizationsChange(e.value)
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
                            disabled={loading || saving}
                            emptyMessage="No organizations found."
                        />

                        <small className="text-500">
                            Select one or more departments, directorates,
                            or external organizations.
                        </small>
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
                            onClick={onClearScope}
                            disabled={saving}
                        />
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default ScopeDialog;