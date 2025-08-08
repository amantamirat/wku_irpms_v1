'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Dropdown } from 'primereact/dropdown';
import { Accessibility, Applicant, Gender, validateApplicant } from '@/models/applicant';
import { Category, Organization } from '@/models/organization';
import { MultiSelect } from 'primereact/multiselect';


interface SaveApplicantDialogProps {
    visible: boolean;
    applicant: Applicant;
    organizations?: Organization[];
    setApplicant: (applicant: Applicant) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveApplicantDialog(props: SaveApplicantDialogProps) {

    const { visible, organizations, applicant, setApplicant, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const isAcademic = applicant.scope === Category.academic;
    const isSupportive = applicant.scope === Category.supportive;
    //const isExternal = applicant.scope === Scope.external;

    const accessibilityOptions = Object.values(Accessibility).map(a => ({
        label: a,
        value: a
    }));

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible]);

    const save = () => {
        setSubmitted(true);
        const result = validateApplicant(applicant);
        if (!result.valid) {
            setErrorMessage(result.message);
            return;
        }
        //setErrorMessage(undefined);
        onSave();
    };

    const hide = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={save} />
        </>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '600px' }}
            header={applicant._id ? 'Edit Applicant' : 'New Applicant'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            {applicant && (<>
                <div className="field">
                    <label htmlFor="first_name">First Name</label>
                    <InputText
                        id="first_name"
                        value={applicant.first_name}
                        onChange={(e) => setApplicant({ ...applicant, first_name: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !applicant.first_name })}
                        required
                    />
                </div>

                <div className="field">
                    <label htmlFor="last_name">Last Name</label>
                    <InputText
                        id="last_name"
                        value={applicant.last_name}
                        onChange={(e) => setApplicant({ ...applicant, last_name: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !applicant.last_name })}
                        required
                    />
                </div>

                <div className="field">
                    <label htmlFor="birth_date">Birth Date</label>
                    <PrimeCalendar
                        id="birth_date"
                        value={applicant.birth_date ? new Date(applicant.birth_date) : undefined}
                        onChange={(e) => setApplicant({ ...applicant, birth_date: e.value! })}
                        dateFormat="yy-mm-dd"
                        showIcon
                        className={classNames({ 'p-invalid': submitted && !applicant.birth_date })}
                        required
                    />
                </div>

                <div className="field">
                    <label htmlFor="gender">Gender</label>
                    <Dropdown
                        id="gender"
                        value={applicant.gender}
                        options={Object.values(Gender).map(g => ({ label: g, value: g }))}
                        onChange={(e) =>
                            setApplicant({ ...applicant, gender: e.value })
                        }
                        placeholder="Select Gender"
                        className={classNames({ 'p-invalid': submitted && !applicant.gender })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="organization">{isAcademic ? "Department" : isSupportive ? "Office" : "Organization"}</label>
                    <Dropdown
                        id="organization"
                        value={applicant.organization}
                        options={organizations}
                        onChange={(e) =>
                            setApplicant({
                                ...applicant,
                                organization: e.value,
                            })
                        }
                        optionLabel="name"
                        placeholder="Select a Workspace"
                        required
                        className={classNames({ 'p-invalid': submitted && !applicant.organization })}
                    />
                </div>
                <div className="field">
                    <label htmlFor="accessibility">Accessibility</label>
                    <MultiSelect
                        id="accessibility"
                        value={applicant.accessibility || []}
                        options={accessibilityOptions}
                        onChange={(e) => setApplicant({ ...applicant, accessibility: e.value })}
                        placeholder="Select Accessibility Types"
                        display="chip"
                        className={classNames({ 'p-invalid': submitted && !applicant.accessibility?.length })}
                    />
                </div>
            </>)}
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveApplicantDialog;
