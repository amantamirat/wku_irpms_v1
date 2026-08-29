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

    // Derived properties
    const parentType = getParentType(localOrg.type);
    const isProgram = localOrg.type === OrgnUnit.program;
    const isExternal = localOrg.type === OrgnUnit.external;

    // Reset local state when dialog visibility changes or item updates
    useEffect(() => {
        if (visible) {
            setLocalOrg({ ...item });
            setSubmitted(false);
        }
    }, [visible, item]);

    // Fetch parent options dynamically when dialog opens
    useEffect(() => {
        if (!visible || !parentType) {
            setParents([]);
            return;
        }

        let isMounted = true;
        const fetchParents = async () => {
            setLoadingParents(true);
            try {
                let scopes = getScopesByUnit(parentType);
                if (scopes === "*") {
                    scopes = await OrganizationApi.getAll({ type: parentType });
                }
                if (isMounted) {
                    setParents(Array.isArray(scopes) ? scopes : []);
                }
            } catch (err) {
                console.error("Failed to load parents", err);
            } finally {
                if (isMounted) setLoadingParents(false);
            }
        };

        fetchParents();

        return () => {
            isMounted = false;
        };
    }, [visible, parentType, getScopesByUnit]);

    const handleHide = () => {
        setSubmitted(false);
        onHide();
    };

    const saveOrganization = async () => {
        setSubmitted(true);

        const validation = validateOrganization(localOrg);
        if (!validation.valid) {
            toast.current?.show({
                severity: 'error',
                summary: 'Validation Error',
                detail: validation.message || 'Validation failed',
                life: 3000,
            });
            return;
        }

        try {
            const saved = localOrg._id
                ? await OrganizationApi.update(localOrg)
                : await OrganizationApi.create(localOrg);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: `${localOrg.type} saved successfully`,
                life: 2000,
            });

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

                {/* Program Specific Fields */}
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
                            {submitted && !localOrg.academicLevel && <small className="p-error">Academic Level is required.</small>}
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
                            {submitted && !localOrg.classification && <small className="p-error">Classification is required.</small>}
                        </div>
                    </>
                )}

                {/* External Specific Fields */}
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
                        {submitted && !localOrg.ownership && <small className="p-error">Ownership is required.</small>}
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default SaveOrganization;