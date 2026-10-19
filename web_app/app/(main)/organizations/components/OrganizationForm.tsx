'use client';

import { FormEvent, useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';

import {
    AcademicLevel,
    Classification,
    getParentType,
    Organization,
    OrgnUnit,
    Ownership,
    validateOrganization
} from '../models/organization.model';
import { OrganizationApi } from '../api/organization.api';
import { ItemFormRenderProps } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { capitalize } from '@/utils/utils';

interface OrganizationFormProps extends ItemFormRenderProps<Organization> {
    type: OrgnUnit;
}

const OrganizationForm = ({ mode, item, saving, formId, onSubmit, type }: OrganizationFormProps) => {
    const toast = useToast();

    const [initial] = useState<Organization>(() => item ?? ({ type } as Organization));
    const [localOrg, setLocalOrg] = useState<Organization>({ ...initial, ...(type ? { type } : {}) });

    const [parents, setParents] = useState<Organization[]>([]);
    const [loadingParents, setLoadingParents] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Derived properties
    const parentType = getParentType(localOrg.type);
    const isProgram = localOrg.type === OrgnUnit.program;
    const isExternal = localOrg.type === OrgnUnit.external;

    // Fetch parent options dynamically when parentType changes or form opens
    useEffect(() => {
        if (!parentType || !OrganizationApi.lookup) {
            setParents([]);
            setLoadingParents(false);
            return;
        }

        let cancelled = false;
        setLoadingParents(true);

        OrganizationApi.lookup({ type: parentType })
            .then((data) => {
                if (!cancelled) {
                    setParents(Array.isArray(data) ? data : []);
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    toast.error(error, `Failed to load ${parentType} options`);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingParents(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [parentType, toast]);

    const nameMissing = !localOrg.name?.trim();
    const parentMissing = Boolean(parentType && !localOrg.parent);
    const academicLevelMissing = isProgram && !localOrg.academicLevel;
    const classificationMissing = isProgram && !localOrg.classification;
    const ownershipMissing = isExternal && !localOrg.ownership;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (saving) return;

        const validation = validateOrganization(localOrg);
        if (!validation.valid) {
            toast.error(validation.message || 'Validation failed', 'Validation Error');
            return;
        }

        await onSubmit({
            ...localOrg,
            name: localOrg.name?.trim(),
        });
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            {/* Parent Selection */}
            {parentType && (
                <div className="field mb-4">
                    <label htmlFor="parent" className="font-bold text-sm block mb-2">
                        {capitalize(parentType)}
                    </label>
                    <Dropdown
                        id="parent"
                        dataKey="_id"
                        value={localOrg.parent}
                        options={parents}
                        optionLabel="name"
                        disabled={saving || loadingParents}
                        onChange={(e: DropdownChangeEvent) => setLocalOrg({ ...localOrg, parent: e.value })}
                        placeholder={loadingParents ? `Loading ${parentType}s...` : `Select ${parentType}`}
                        className={classNames({ 'p-invalid': submitted && parentMissing })}
                    />
                    {submitted && parentMissing && (
                        <small className="p-error">Parent is required.</small>
                    )}
                </div>
            )}

            {/* Name */}
            <div className="field mb-4">
                <label htmlFor="name" className="font-bold text-sm block mb-2">
                    Name
                </label>
                <InputText
                    id="name"
                    value={localOrg.name || ''}
                    disabled={saving}
                    onChange={(e) => setLocalOrg({ ...localOrg, name: e.target.value })}
                    required
                    autoFocus
                    placeholder={`Enter ${localOrg.type || 'organization'} name`}
                    className={classNames({ 'p-invalid': submitted && nameMissing })}
                />
                {submitted && nameMissing && (
                    <small className="p-error">Name is required.</small>
                )}
            </div>

            {/* Program Specific Fields */}
            {isProgram && (
                <>
                    <div className="field mb-4">
                        <label htmlFor="academicLevel" className="font-bold text-sm block mb-2">
                            Academic Level
                        </label>
                        <Dropdown
                            id="academicLevel"
                            value={localOrg.academicLevel}
                            options={Object.values(AcademicLevel).map((v) => ({ label: v, value: v }))}
                            disabled={saving}
                            onChange={(e: DropdownChangeEvent) => setLocalOrg({ ...localOrg, academicLevel: e.value })}
                            placeholder="Select Level"
                            className={classNames({ 'p-invalid': submitted && academicLevelMissing })}
                        />
                        {submitted && academicLevelMissing && (
                            <small className="p-error">Academic Level is required.</small>
                        )}
                    </div>
                    <div className="field mb-4">
                        <label htmlFor="classification" className="font-bold text-sm block mb-2">
                            Classification
                        </label>
                        <Dropdown
                            id="classification"
                            value={localOrg.classification}
                            options={Object.values(Classification).map((v) => ({ label: v, value: v }))}
                            disabled={saving}
                            onChange={(e: DropdownChangeEvent) => setLocalOrg({ ...localOrg, classification: e.value })}
                            placeholder="Select Classification"
                            className={classNames({ 'p-invalid': submitted && classificationMissing })}
                        />
                        {submitted && classificationMissing && (
                            <small className="p-error">Classification is required.</small>
                        )}
                    </div>
                </>
            )}

            {/* External Specific Fields */}
            {isExternal && (
                <div className="field mb-4">
                    <label htmlFor="ownership" className="font-bold text-sm block mb-2">
                        Ownership
                    </label>
                    <Dropdown
                        id="ownership"
                        value={localOrg.ownership}
                        options={Object.values(Ownership).map((v) => ({ label: v, value: v }))}
                        disabled={saving}
                        onChange={(e: DropdownChangeEvent) => setLocalOrg({ ...localOrg, ownership: e.value })}
                        placeholder="Select Ownership"
                        className={classNames({ 'p-invalid': submitted && ownershipMissing })}
                    />
                    {submitted && ownershipMissing && (
                        <small className="p-error">Ownership is required.</small>
                    )}
                </div>
            )}
        </form>
    );
};

export default OrganizationForm;