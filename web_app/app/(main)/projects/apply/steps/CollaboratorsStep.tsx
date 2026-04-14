'use client';
import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { Project } from '../../models/project.model';
import { Applicant } from '@/app/(main)/applicants/models/applicant.model';
import { ApplicantApi } from '@/app/(main)/applicants/api/applicant.api';



interface CollaboratorsStepProps {
    data: Partial<Project>;
    onUpdate: (data: Partial<Project>) => void;
    onNext: () => void;
    onBack: () => void;
}

export const CollaboratorsStep = ({ data, onUpdate, onNext, onBack }: CollaboratorsStepProps) => {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch existing applicants to link to collaborators
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

    const roleOptions = [
        { label: 'Principal Investigator', value: 'Principal Investigator' },
        { label: 'Co-Investigator', value: 'Co-Investigator' },
        { label: 'Researcher', value: 'Researcher' },
        { label: 'Consultant', value: 'Consultant' },
        { label: 'Project Manager', value: 'Project Manager' }
    ];

    const addCollaborator = () => {
        const newCollabs = [...(data.collaborators || [])];
        newCollabs.push({
            applicant: '', // Will hold Applicant ID or Object
            role: '',
            isLeadPI: false
        } as any);
        onUpdate({ ...data, collaborators: newCollabs });
    };

    const removeCollaborator = (index: number) => {
        const newCollabs = data.collaborators?.filter((_, i) => i !== index);
        onUpdate({ ...data, collaborators: newCollabs });
    };

    const updateCollaborator = (index: number, field: string, value: any) => {
        const newCollabs = [...(data.collaborators || [])];
        newCollabs[index] = { ...newCollabs[index], [field]: value };
        
        // Logical Guard: If this is set as Lead PI, unset others
        if (field === 'isLeadPI' && value === true) {
            newCollabs.forEach((c, i) => { if (i !== index) (c as any).isLeadPI = false; });
        }

        onUpdate({ ...data, collaborators: newCollabs });
    };

    const actionTemplate = (_: any, options: { rowIndex: number }) => (
        <Button 
            icon="pi pi-user-minus" 
            className="p-button-rounded p-button-danger p-button-text" 
            onClick={() => removeCollaborator(options.rowIndex)} 
        />
    );

    return (
        <div className="mt-4">
            <div className="flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="m-0 text-900">Project Team & Collaborators</h4>
                    <p className="text-500 text-sm">Link registered applicants to roles within this project.</p>
                </div>
                <Button 
                    label="Add Member" 
                    icon="pi pi-user-plus" 
                    className="p-button-sm p-button-outlined" 
                    onClick={addCollaborator} 
                />
            </div>

            <DataTable 
                value={data.collaborators} 
                className="p-datatable-sm shadow-1 border-round-lg overflow-hidden"
                emptyMessage="No collaborators added. Individual projects can proceed to the next step."
            >
                {/* Applicant Selection */}
                <Column header="Collaborator / Entity" style={{ width: '35%' }} body={(rowData, options) => (
                    <Dropdown
                        value={typeof rowData.applicant === 'object' ? rowData.applicant?._id : rowData.applicant}
                        options={applicants}
                        optionLabel="name"
                        optionValue="_id"
                        onChange={(e) => updateCollaborator(options.rowIndex, 'applicant', e.value)}
                        placeholder="Select Applicant"
                        filter
                        className="w-full"
                        //loading={loading}
                    />
                )} />

                {/* Role Selection (Editable) */}
                <Column header="Role" style={{ width: '35%' }} body={(rowData, options) => (
                    <Dropdown
                        value={rowData.role}
                        options={roleOptions}
                        onChange={(e) => updateCollaborator(options.rowIndex, 'role', e.value)}
                        placeholder="Select or Type Role"
                        editable // <--- Allows custom roles
                        className="w-full text-sm"
                    />
                )} />

                {/* Lead PI Toggle */}
                <Column header="Lead" headerClassName="text-center" bodyClassName="text-center" body={(rowData, options) => (
                    <div className="flex flex-column align-items-center">
                        <Checkbox 
                            onChange={e => updateCollaborator(options.rowIndex, 'isLeadPI', e.checked)} 
                            checked={rowData.isLeadPI}
                            tooltip="Set as Main Contact (Lead PI)"
                        />
                    </div>
                )} />

                <Column body={actionTemplate} style={{ width: '4rem' }} />
            </DataTable>

            {/* Navigation */}
            <div className="flex justify-content-between mt-6 pt-4 border-top-1 surface-border">
                <Button label="Back" icon="pi pi-chevron-left" onClick={onBack} className="p-button-text p-button-secondary" />
                <Button label="Next: Submission" icon="pi pi-chevron-right" iconPos="right" onClick={onNext} className="px-5 shadow-2" />
            </div>
        </div>
    );
};