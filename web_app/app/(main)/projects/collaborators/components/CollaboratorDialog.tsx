'use client';

import { ApplicantApi } from "@/app/(main)/applicants/api/applicant.api";
import { Applicant, applicantUnits } from "@/app/(main)/applicants/models/applicant.model";
import { applicantTemplate } from "@/app/(main)/applicants/models/applicant.template";
import { OrganizationApi } from "@/app/(main)/organizations/api/organization.api";
import { Organization, OrgnUnit } from "@/app/(main)/organizations/models/organization.model";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { CollaboratorApi } from "../api/collaborator.api";
import { Collaborator, CollaboratorStatus } from "../models/collaborator.model";

interface CollaboratorDialogProps {
    collaborator: Collaborator;
    visible: boolean;
    onSave?: (saved: Collaborator) => void;
    onComplete?: (saved: Collaborator) => void;
    onHide: () => void;
}

const CollaboratorDialog = ({ collaborator, visible, onSave, onComplete, onHide }: CollaboratorDialogProps) => {
    const [localCollaborator, setLocalCollaborator] = useState<Collaborator>({ ...collaborator });
    //const [scope, setScope] = useState<OrgnUnit>();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [workspace, setWorkspace] = useState<Organization>();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        setLocalCollaborator({ ...collaborator });
    }, [collaborator]);

    // Fetch organizations
    useEffect(() => {
        let isMounted = true;
        const fetchOrganizations = async () => {
            try {
                const depData = await OrganizationApi.getOrganizations({ type: OrgnUnit.Department });
                const extData = await OrganizationApi.getOrganizations({ type: OrgnUnit.External });
                if (isMounted) setOrganizations([...depData, ...extData]);
            } catch (err) {
                console.error("Failed to fetch organizations:", err);
            }
        };
        fetchOrganizations();
        return () => { isMounted = false; };
    }, []);

    // Fetch applicants based on workspace
    useEffect(() => {
        let isMounted = true;
        const fetchApplicants = async () => {
            if (!workspace) return;
            try {
                const data = await ApplicantApi.getApplicants({ workspace: workspace});
                if (isMounted) setApplicants(data);
            } catch (err) {
                console.error("Failed to fetch applicants:", err);
            }
        };
        fetchApplicants();
        return () => { isMounted = false; };
    }, [workspace]);

    const saveCollaborator = async () => {
        try {
            let saved: Collaborator;
            if (onSave) {
                saved = { ...localCollaborator };
                onSave(localCollaborator);
            } else {
                if (localCollaborator._id) {
                    saved = { ...localCollaborator }
                    // saved = await CollaboratorApi.updateCollaborator(localCollaborator);
                } else {
                    saved = await CollaboratorApi.createCollaborator(localCollaborator);
                }
                saved = {
                    ...saved,
                    project: localCollaborator.project,
                    applicant: localCollaborator.applicant
                };
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Collaborator saved',
                    life: 2000
                });
            }
            if (onComplete) onComplete(saved);

        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save collaborator',
                detail: '' + err,
                life: 2000
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveCollaborator} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={'Collaborator Detail'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {(!localCollaborator._id)
                    && <>
                        <div className="field">
                            <label htmlFor="workspace">Workspace</label>
                            <Dropdown
                                id="workspace"
                                value={workspace}
                                options={organizations}
                                onChange={(e) => setWorkspace(e.value)}
                                optionLabel="name"
                                placeholder="Select a Workspace"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="applicant">Collaborator</label>
                            <Dropdown
                                id="applicant"
                                value={localCollaborator.applicant}
                                options={applicants}
                                onChange={(e) => setLocalCollaborator({ ...localCollaborator, applicant: e.value })}
                                dataKey="_id"
                                optionLabel="first_name"
                                itemTemplate={applicantTemplate}
                                valueTemplate={(option) =>
                                    option
                                        ? applicantTemplate(option)
                                        : <span className="p-placeholder">Select a Collaborator</span>
                                }
                                placeholder="Select a Collaborator"
                            />
                        </div>
                    </>}
            </Dialog >
        </>
    );
}
export default CollaboratorDialog;