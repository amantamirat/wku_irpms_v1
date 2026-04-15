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
import { Applicant } from '@/app/(main)/applicants/models/applicant.model';
import { ApplicantApi } from '@/app/(main)/applicants/api/applicant.api';
import { roleOptions } from '../../collaborators/models/collaborator.model';
import { Constraint, ProjectConstraintType } from '@/app/(main)/grants/constraints/models/constraint.model';

interface CollaboratorsStepProps {
    data: Partial<Project>;
    constraints: Constraint[]; // Added constraints
    onUpdate: (data: Partial<Project>) => void;
    onNext: () => void;
    onBack: () => void;
}

export const CollaboratorsStep = ({ data, constraints, onUpdate, onNext, onBack }: CollaboratorsStepProps) => {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchApplicants = async () => {
            setLoading(true);
            try {
                const res = await ApplicantApi.getAll({});
                setApplicants(res);
            } catch (err) {
                console.error("Failed to fetch applicants", err);
            } finally {
                setLoading(false);
            }
        };
        fetchApplicants();
    }, []);

    // --- Validation Logic ---
    const validation = useMemo(() => {
        const collabLimit = constraints.find(c => c.constraint === ProjectConstraintType.PARTICIPANT);
        const collabs = data.collaborators || [];
        
        const isCountValid = !collabLimit || (
            collabs.length >= (collabLimit.min ?? 0) && 
            collabs.length <= (collabLimit.max ?? Infinity)
        );

        const hasEmptyRows = collabs.some(c => !c.applicant || !c.role);

        return {
            isCountValid,
            collabLimit,
            currentCount: collabs.length,
            hasEmptyRows,
            isValid: isCountValid && !hasEmptyRows
        };
    }, [data.collaborators, constraints]);

    const isMaxReached = !!(validation.collabLimit?.max && validation.currentCount >= validation.collabLimit.max);

    // --- Actions ---
    const addCollaborator = () => {
        if (isMaxReached) return;
        const newCollabs = [...(data.collaborators || [])];
        newCollabs.push({
            applicant: '',
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
                        Required team size: {validation.collabLimit?.min || 1} - {validation.collabLimit?.max || 'No limit'} members.
                    </p>
                </div>
                <Button
                    label="Add Member"
                    icon="pi pi-user-plus"
                    className="p-button-sm p-button-outlined"
                    onClick={addCollaborator}
                    disabled={isMaxReached}
                    tooltip={isMaxReached ? "Maximum team size reached" : ""}
                />
            </div>

            {submitted && !validation.isCountValid && (
                <Message 
                    severity="error" 
                    text={`Team size must be between ${validation.collabLimit?.min} and ${validation.collabLimit?.max} members.`} 
                    className="w-full mb-3" 
                />
            )}

            <DataTable
                value={data.collaborators}
                className="p-datatable-sm shadow-1 border-round-lg overflow-hidden"
                emptyMessage="No collaborators added. Individual projects can proceed."
                responsiveLayout="stack"
            >
                <Column header="Collaborator" style={{ width: '40%' }} body={(rowData, options) => {
                    const selectedIds = data.collaborators?.map(c => 
                        typeof c.applicant === 'object' ? c.applicant?._id : c.applicant
                    ).filter(id => id) || [];

                    const availableApplicants = applicants.filter(app => {
                        const isCurrent = (typeof rowData.applicant === 'object' ? rowData.applicant?._id : rowData.applicant) === app._id;
                        return !selectedIds.includes(app._id) || isCurrent;
                    });

                    return (
                        <Dropdown
                            value={typeof rowData.applicant === 'object' ? rowData.applicant?._id : rowData.applicant}
                            options={availableApplicants}
                            optionLabel="name"
                            optionValue="_id"
                            onChange={(e) => updateCollaborator(options.rowIndex, 'applicant', e.value)}
                            placeholder="Select Applicant"
                            filter
                            className={classNames("w-full", { 'p-invalid': submitted && !rowData.applicant })}
                            disabled={rowData.isLeadPI}
                        />
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

                <Column header="Lead" headerClassName="text-center" bodyClassName="text-center" style={{ width: '10%' }} body={(rowData) => (
                    <Checkbox checked={rowData.isLeadPI} disabled={true} />
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