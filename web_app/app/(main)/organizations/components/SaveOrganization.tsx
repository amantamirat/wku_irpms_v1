'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';

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
import { useAuth } from '@/contexts/auth-context';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveOrganization = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<Organization>) => {
    const toast = useRef<Toast>(null);
    const { getScopesByUnit } = useAuth();

    const [localOrg, setLocalOrg] = useState<Organization>({ ...item });
    const [parents, setParents] = useState<Organization[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [loadingParents, setLoadingParents] = useState(false);

    const parentType = getParentType(item.type);
    const isProgram = localOrg.type === OrgnUnit.program;
    const isExternal = localOrg.type === OrgnUnit.external;

    // Sync local state with prop item
    useEffect(() => {
        setLocalOrg({ ...item });
    }, [item]);

    // Fetch Parents when dialog opens and parentType is known
    useEffect(() => {
        if (!visible || !parentType) return;

        const fetchParents = async () => {
            setLoadingParents(true);
            try {
                let scopes = getScopesByUnit(parentType);
                if (scopes === "*") {
                    scopes = await OrganizationApi.getAll({ type: parentType });
                }
                setParents(Array.isArray(scopes) ? scopes : []);
            } catch (err) {
                console.error("Failed to load parents", err);
            } finally {
                setLoadingParents(false);
            }
        };

        fetchParents();
    }, [visible, parentType, getScopesByUnit]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalOrg({ ...item });
    };

    const handleHide = () => {
        clearForm();
        onHide();
    };

    const saveOrganization = async () => {
        setSubmitted(true);
        try {
            const validation = validateOrganization(localOrg);
            if (!validation.valid) {
                throw new Error(validation.message || "Validation failed");
            }

            const saved = localOrg._id
                ? await OrganizationApi.update(localOrg)
                : await OrganizationApi.create(localOrg);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: `${localOrg.type} saved successfully`,
                life: 2000,
            });

            // Brief delay to allow toast to be seen before closing/refreshing
            if (onComplete) {
                setTimeout(() => onComplete({ ...saved, parent: localOrg.parent }), 500);
            }
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'An unexpected error occurred',
                life: 3000,
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={handleHide} />
            <Button label="Save" icon="pi pi-check" onClick={saveOrganization} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header={localOrg._id ? `Edit ${localOrg.type}` : `New ${localOrg.type}`}
                modal
                className="p-fluid"
                footer={footer}
                onHide={handleHide}
            >
                {/* Parent Selection */}
                {parentType && (
                    <div className="field">
                        <label htmlFor="parent">{parentType}</label>
                        <Dropdown
                            id="parent"
                            dataKey="_id"
                            value={localOrg.parent}
                            options={parents}
                            optionLabel="name"
                            //loading={loadingParents}
                            onChange={(e) => setLocalOrg({ ...localOrg, parent: e.value })}
                            placeholder={`Select ${parentType}`}
                            className={classNames({ 'p-invalid': submitted && !localOrg.parent })}
                        />
                        {submitted && !localOrg.parent && <small className="p-error">Parent is required.</small>}
                    </div>
                )}

                {/* Name */}
                <div className="field">
                    <label htmlFor="name">Name</label>
                    <InputText
                        id="name"
                        value={localOrg.name || ''}
                        onChange={(e) => setLocalOrg({ ...localOrg, name: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localOrg.name })}
                    />
                    {submitted && !localOrg.name && <small className="p-error">Name is required.</small>}
                </div>

                {/* Academic Fields (Programs) */}
                {isProgram && (
                    <>
                        <div className="field">
                            <label htmlFor="academicLevel">Academic Level</label>
                            <Dropdown
                                id="academicLevel"
                                value={localOrg.academicLevel}
                                options={Object.values(AcademicLevel).map(v => ({ label: v, value: v }))}
                                onChange={(e) => setLocalOrg({ ...localOrg, academicLevel: e.value })}
                                placeholder="Select Level"
                                className={classNames({ 'p-invalid': submitted && !localOrg.academicLevel })}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="classification">Classification</label>
                            <Dropdown
                                id="classification"
                                value={localOrg.classification}
                                options={Object.values(Classification).map(v => ({ label: v, value: v }))}
                                onChange={(e) => setLocalOrg({ ...localOrg, classification: e.value })}
                                placeholder="Select Classification"
                                className={classNames({ 'p-invalid': submitted && !localOrg.classification })}
                            />
                        </div>
                    </>
                )}

                {/* External Fields */}
                {isExternal && (
                    <div className="field">
                        <label htmlFor="ownership">Ownership</label>
                        <Dropdown
                            id="ownership"
                            value={localOrg.ownership}
                            options={Object.values(Ownership).map(v => ({ label: v, value: v }))}
                            onChange={(e) => setLocalOrg({ ...localOrg, ownership: e.value })}
                            placeholder="Select Ownership"
                            className={classNames({ 'p-invalid': submitted && !localOrg.ownership })}
                        />
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default SaveOrganization;