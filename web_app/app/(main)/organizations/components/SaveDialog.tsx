'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { AcademicLevel, Classification, Organization, OrgnUnit, Ownership, validateOrganization } from '../models/organization.model';
import { OrganizationApi } from '../api/organization.api';
import { Toast } from 'primereact/toast';

interface SaveDialogProps {
    visible: boolean;
    organization: Organization;
    parentType?: OrgnUnit;
    parents?: Organization[];
    onHide: () => void;
    onComplete: (savedOrganization: Organization) => void;
}

const SaveDialog = ({ visible, organization, parents, parentType, onHide, onComplete }: SaveDialogProps) => {
    
    const toast = useRef<Toast>(null);
    const [localOrganization, setLocalOrganization] = useState<Organization>({ ...organization });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalOrganization({ ...organization });
    }, [organization]);

    const isProgram = localOrganization.type === OrgnUnit.Program;
    // const isSpecialization = localOrganization.type === OrgnUnit.Specialization;
    const isExternal = localOrganization.type === OrgnUnit.External;



    const saveOrganization = async () => {
        try {
            setSubmitted(true);
            const result = validateOrganization(localOrganization);
            if (!result.valid) {
                throw new Error(result.message || "Validation failed");
            }
            let saved: Organization;
            if (localOrganization._id) {
                // update existing
                saved = await OrganizationApi.updateOrganization(localOrganization);
            } else {
                // create new
                saved = await OrganizationApi.createOrganization(localOrganization);
            }
            saved = {
                ...saved,
                parent: localOrganization.parent
            };
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: `${localOrganization.type} saved successfully`,
                life: 2000,
            });
            // call parent callback
            if (onComplete) onComplete(saved);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: `Failed to save ${localOrganization.type}`,
                detail: err.message || '' + err,
                life: 2000,
            });
        }
    };


    const hide = () => {
        setSubmitted(false);
        onHide();
    };

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
        }
    }, [visible]);

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveOrganization} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header={localOrganization._id ? `Edit ${localOrganization.type} Details` : `New ${localOrganization.type} Details`}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {(parents && parentType) &&
                    <div className="field">
                        <label htmlFor="parent">
                            {parentType}
                        </label>
                        <Dropdown
                            id="parent"
                            dataKey="_id"
                            value={localOrganization.parent}
                            options={parents}
                            optionLabel="name"
                            onChange={(e) => setLocalOrganization({ ...localOrganization, parent: e.value })}
                            placeholder={`Select ${parentType}`}
                            className={classNames({ 'p-invalid': submitted && !localOrganization.parent })}
                        />
                    </div>
                }

                <div className="field">
                    <label htmlFor="name">{localOrganization.type} Name</label>
                    <InputText
                        id="name"
                        value={localOrganization.name}
                        onChange={(e) => setLocalOrganization({ ...localOrganization, name: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localOrganization.name })}
                    />
                    {submitted && !localOrganization.name && (
                        <small className="p-invalid">Name is required.</small>
                    )}
                </div>

                {( //isSpecialization || 
                    isProgram) && (
                        <>
                            <div className="field">
                                <label htmlFor="academic_level">Academic Level</label>
                                <Dropdown
                                    id="academic_level"
                                    value={localOrganization.academicLevel}
                                    options={Object.values(AcademicLevel).map(level => ({ label: level, value: level }))}
                                    onChange={(e) => setLocalOrganization({ ...localOrganization, academicLevel: e.value })}
                                    placeholder="Select Ac. Level"
                                    className={classNames({ 'p-invalid': submitted && !localOrganization.academicLevel })}
                                />
                                {submitted && !localOrganization.academicLevel && (
                                    <small className="p-invalid">Ac. Level is required.</small>
                                )}
                            </div>

                            {isProgram && (
                                <div className="field">
                                    <label htmlFor="classification">Classification</label>
                                    <Dropdown
                                        id="classification"
                                        value={localOrganization.classification}
                                        options={Object.values(Classification).map(level => ({ label: level, value: level }))}
                                        onChange={(e) => setLocalOrganization({ ...localOrganization, classification: e.value })}
                                        placeholder="Select Classification"
                                        className={classNames({ 'p-invalid': submitted && !localOrganization.classification })}
                                    />
                                    {submitted && !localOrganization.classification && (
                                        <small className="p-invalid">Classification is required.</small>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                {isExternal && (
                    <div className="field">
                        <label htmlFor="ownership">Ownership</label>
                        <Dropdown
                            id="ownership"
                            value={localOrganization.ownership}
                            options={Object.values(Ownership).map(level => ({ label: level, value: level }))}
                            onChange={(e) => setLocalOrganization({ ...localOrganization, ownership: e.value })}
                            placeholder="Select Ownership"
                            className={classNames({ 'p-invalid': submitted && !localOrganization.ownership })}
                        />
                        {submitted && !localOrganization.ownership && (
                            <small className="p-invalid">Ownership is required.</small>
                        )}
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default SaveDialog;
