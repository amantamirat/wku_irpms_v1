'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { Project } from '../../models/project.model';
import { User } from '@/app/(main)/users/models/user.model';
import { UserApi } from '@/app/(main)/users/api/user.api';
import { roleOptions } from '../../../collaborators/models/collaborator.model';
import { Constraint } from '@/app/(main)/constraints/models/constraint.model';
import { useAuth } from '@/contexts/auth-context';

interface CollaboratorsStepProps {
    data: Partial<Project>;
    constraint?: Constraint;
    onUpdate: (data: Partial<Project>) => void;
    onNext: () => void;
    onBack: () => void;
}

export const CollaboratorsStep = ({ data, constraint, onUpdate, onNext, onBack }: CollaboratorsStepProps) => {
    const { hasPermission } = useAuth();
    const canReadUsers = hasPermission(["user:read"]);

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (canReadUsers) {
            const fetchUsers = async () => {
                setLoading(true);
                try {
                    const res = await UserApi.getAll({});
                    setUsers(res);
                } catch (err) {
                    console.error("Failed to fetch applicants", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchUsers();
        }
    }, [canReadUsers]);

    // --- Validation Logic ---
    const validation = useMemo(() => {
        const collabs = data.collaborators || [];

        const isCountValid =
            collabs.length >= (constraint?.minParticipants ?? 0) &&
            collabs.length <= (constraint?.maxParticipants ?? Infinity);

        const hasEmptyRows = collabs.some(c => !c.member || !c.role);

        return {
            isCountValid,
            currentCount: collabs.length,
            hasEmptyRows,
            isValid: isCountValid && !hasEmptyRows
        };
    }, [data.collaborators, constraint]);

    const isMaxReached = !!(constraint?.maxParticipants && validation.currentCount >= constraint.maxParticipants);

    // --- Actions ---
    const addCollaborator = () => {
        if (isMaxReached) return;
        const newCollabs = [...(data.collaborators || [])];
        newCollabs.push({
            member: '',
            role: '',
            isLeadPI: false
        } as any);
        onUpdate({ ...data, collaborators: newCollabs });
    };

    const removeCollaborator = (index: number) => {
        if (data.collaborators?.[index]?.isLeadPI) return;
        const newCollabs = data.collaborators?.filter((_, i) => i !== index);
        onUpdate({ ...data, collaborators: newCollabs });
    };

    const updateCollaborator = (index: number, field: string, value: any) => {
        const newCollabs = [...(data.collaborators || [])];
        newCollabs[index] = { ...newCollabs[index], [field]: value };
        onUpdate({ ...data, collaborators: newCollabs });
    };

    const validateAndNext = () => {
        setSubmitted(true);
        if (validation.isValid) {
            onNext();
        }
    };

    return (
        <div className="mt-4">
            <div className="flex justify-content-between align-items-center mb-4 p-3 bg-gray-50 border-round-lg border-1 border-200">
                <div>
                    <h4 className="m-0 text-900">Project Team</h4>
                    <p className="text-600 text-sm m-0">
                        Required team size: {constraint?.minParticipants ?? 1} - {constraint?.maxParticipants ?? 'No limit'} members.
                    </p>
                </div>
                <Button
                    label="Add Member"
                    icon="pi pi-user-plus"
                    className="p-button-sm p-button-outlined"
                    onClick={addCollaborator}
                    disabled={isMaxReached}
                    tooltip={isMaxReached ? `Maximum of ${constraint?.maxParticipants} members reached` : ""}
                    tooltipOptions={{ showOnDisabled: true }}
                />
            </div>

            {submitted && !validation.isCountValid && (
                <Message
                    severity="error"
                    text={`Team size must be between ${constraint?.minParticipants ?? 0} and ${constraint?.maxParticipants ?? 'unlimited'} members.`}
                    className="w-full mb-3"
                />
            )}

            <DataTable
                value={data.collaborators}
                className="p-datatable-sm shadow-1 border-round-lg overflow-hidden"
                emptyMessage="No collaborators added. Individual projects can proceed."
                loading={loading}
            >
                <Column header="Collaborator" style={{ width: '40%' }} body={(rowData, options) => {
                    const selectedIds = data.collaborators?.map(c =>
                        typeof c.member === 'object' ? c.member?._id : c.member
                    ).filter(id => id) || [];

                    const availableUsers = users.filter(usr => {
                        const isCurrent = (typeof rowData.member === 'object' ? rowData.member?._id : rowData.member) === usr._id;
                        return !selectedIds.includes(usr._id) || isCurrent;
                    });

                    return (
                        <>
                            <Dropdown
                                value={typeof rowData.member === 'object' ? rowData.member?._id : rowData.member}
                                options={availableUsers}
                                optionLabel="name"
                                optionValue="_id"
                                onChange={(e) => updateCollaborator(options.rowIndex, 'member', e.value)}
                                placeholder="Select Member"
                                filter
                                className={classNames("w-full", { 'p-invalid': submitted && !rowData.member })}
                                disabled={rowData.isLeadPI}
                            />
                            {!canReadUsers && (
                                <small className="p-error block mt-1">
                                    <i className="pi pi-exclamation-triangle mr-1 text-xs"></i>
                                    Insufficient permissions to modify collaborators.
                                </small>
                            )}
                        </>
                    );
                }} />

                <Column header="Role" style={{ width: '35%' }} body={(rowData, options) => (
                    <Dropdown
                        value={rowData.role}
                        options={roleOptions}
                        onChange={(e) => updateCollaborator(options.rowIndex, 'role', e.value)}
                        placeholder="Select Role"
                        editable
                        className={classNames("w-full text-sm", { 'p-invalid': submitted && !rowData.role })}
                        disabled={rowData.isLeadPI}
                    />
                )} />

                <Column style={{ width: '4rem' }} body={(rowData, options) => (
                    <Button
                        icon="pi pi-user-minus"
                        className="p-button-rounded p-button-danger p-button-text"
                        onClick={() => removeCollaborator(options.rowIndex)}
                        disabled={rowData.isLeadPI}
                    />
                )} />
            </DataTable>

            {/* Navigation */}
            <div className="flex justify-content-between mt-6 pt-4 border-top-1 surface-border">
                <Button label="Back to Phases" icon="pi pi-chevron-left" onClick={onBack} className="p-button-text p-button-secondary" />
                <Button
                    label="Next: Submission"
                    icon="pi pi-chevron-right"
                    iconPos="right"
                    onClick={validateAndNext}
                    className={classNames("px-5", { 'p-shake': submitted && !validation.isValid })}
                />
            </div>
        </div>
    );
};