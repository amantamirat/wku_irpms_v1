'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { Department, validateDepartment } from '@/models/department';
import { College } from '@/models/college';

interface SaveDialogProps {
    visible: boolean;
    department: Department;
    colleges: College[];
    onChange: (department: Department) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, department, colleges, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);

    // On college change
    const handleCollegeChange = (e: { value: string | College }) => {
        const updatedDepartment = { ...department, college: e.value };
        onChange(updatedDepartment);
    };

    // On save
    const save = async () => {
        setSubmitted(true);
        if (!validateDepartment(department)) {
            return;
        }
        onSave();
    };

    // On hide dialog
    const hide = async () => {
        setSubmitted(false);
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={save} />
        </>
    );

    useEffect(() => {
        // Reset the state when dialog is hidden
        if (!visible) {
            setSubmitted(false);
        }
    }, [visible]);

    return (
        <Dialog
            visible={visible}
            style={{ width: '450px' }}
            header={department._id ? 'Edit Department Details' : 'New Department Details'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            {department && (
                <>
                    <div className="field">
                        <label htmlFor="department_name">Department Name</label>
                        <InputText
                            id="department_name"
                            value={department.department_name}
                            onChange={(e) => onChange({ ...department, department_name: e.target.value })}
                            required
                            autoFocus
                            className={classNames({ 'p-invalid': submitted && !department.department_name })}
                        />
                        {submitted && !department.department_name && (
                            <small className="p-invalid">Department Name is required.</small>
                        )}
                    </div>

                    <div className="field">
                        <label htmlFor="college">College</label>
                        <Dropdown
                            id="college"
                            value={department.college}
                            options={colleges}
                            onChange={handleCollegeChange}
                            optionLabel="college_name"
                            placeholder="Select a College"
                            required
                            className={classNames({ 'p-invalid': submitted && !department.college })}
                        />
                        {submitted && !department.college && (
                            <small className="p-invalid">College is required.</small>
                        )}
                    </div>
                </>
            )}
        </Dialog>
    );
}

export default SaveDialog;
