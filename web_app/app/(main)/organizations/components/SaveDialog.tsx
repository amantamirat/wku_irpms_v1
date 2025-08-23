'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { AcademicLevel, Category, Classification, Organization, OrganizationType, Ownership, validateOrganization } from '../models/organization.model';

interface SaveDialogProps {
    visible: boolean;
    organization: Organization;
    onChange: (organization: Organization) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, organization, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const isProgram = organization.type === OrganizationType.Program;
    const isSpecialization = organization.type === OrganizationType.Specialization;
    const isPosition = organization.type === OrganizationType.Position;
    const isExternal = organization.type === OrganizationType.External;

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible]);

    const save = async () => {
        setSubmitted(true);
        const result = validateOrganization(organization);
        if (!result.valid) {
            setErrorMessage(result.message);
            return;
        }
        //setErrorMessage(undefined);
        onSave();
    }

    const hide = async () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        onHide();
    }

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={save} />
        </>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '450px' }}
            header={organization._id ? `Edit ${organization.type} Details` : `New ${organization.type} Details`}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        //position={organization._id ? 'right' : 'center'}
        >
            {organization && (
                <>
                    <div className="field">
                        <label htmlFor="name">{organization.type} Name</label>
                        <InputText
                            id="name"
                            value={organization.name}
                            onChange={(e) => onChange({ ...organization, name: e.target.value })}
                            required
                            autoFocus
                            className={classNames({ 'p-invalid': submitted && !organization.name })}
                        />
                        {submitted && !organization.name && (
                            <small className="p-invalid">Name is required.</small>
                        )}
                    </div>

                    {(isSpecialization || isProgram) &&
                        (<>
                            <div className="field">
                                <label htmlFor="academic_level">Academic Level</label>
                                <Dropdown
                                    id="academic_level"
                                    value={organization.academic_level}
                                    options={Object.values(AcademicLevel).map(level => ({ label: level, value: level }))}
                                    onChange={(e) =>
                                        props.onChange({ ...organization, academic_level: e.value })
                                    }
                                    placeholder="Select Ac. Level"
                                    className={classNames({ 'p-invalid': submitted && (isSpecialization || isProgram) && !organization.academic_level })}
                                />
                                {submitted && (isSpecialization || isProgram) && !organization.academic_level && (
                                    <small className="p-invalid">Ac. Level is required.</small>
                                )}
                            </div>

                            {isProgram &&
                                (<div className="field">
                                    <label htmlFor="classification">Classification</label>
                                    <Dropdown
                                        id="classification"
                                        value={organization.classification}
                                        options={Object.values(Classification).map(level => ({ label: level, value: level }))}
                                        onChange={(e) =>
                                            props.onChange({ ...organization, classification: e.value })
                                        }
                                        placeholder="Select Classification"
                                        className={classNames({ 'p-invalid': submitted && isProgram && !organization.classification })}
                                    />
                                    {submitted && isProgram && !organization.classification && (
                                        <small className="p-invalid">Classification is required.</small>
                                    )}
                                </div>)}
                        </>
                        )}

                    {isPosition &&
                        (<div className="field">
                            <label htmlFor="category">Category</label>
                            <Dropdown
                                id="category"
                                value={organization.category}
                                options={Object.values(Category).map(level => ({ label: level, value: level }))}
                                onChange={(e) =>
                                    props.onChange({ ...organization, category: e.value })
                                }
                                placeholder="Select Category"
                                className={classNames({ 'p-invalid': submitted && isPosition && !organization.category })}
                            />
                            {submitted && isPosition && !organization.category && (
                                <small className="p-invalid">Category is required.</small>
                            )}
                        </div>)
                    }

                    {isExternal &&
                        (<div className="field">
                            <label htmlFor="ownership">Ownership</label>
                            <Dropdown
                                id="ownership"
                                value={organization.ownership}
                                options={Object.values(Ownership).map(level => ({ label: level, value: level }))}
                                onChange={(e) =>
                                    props.onChange({ ...organization, ownership: e.value })
                                }
                                placeholder="Select Ownership"
                                className={classNames({ 'p-invalid': submitted && isExternal && !organization.ownership })}
                            />
                            {submitted && isExternal && !organization.ownership && (
                                <small className="p-invalid">Ownership is required.</small>
                            )}
                        </div>)
                    }
                </>
            )}
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
