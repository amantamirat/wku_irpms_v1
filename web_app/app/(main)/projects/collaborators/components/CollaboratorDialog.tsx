import { ApplicantApi } from "@/app/(main)/applicants/api/applicant.api";
import { Applicant, scopeToOrganizationUnit } from "@/app/(main)/applicants/models/applicant.model";
import { OrganizationApi } from "@/app/(main)/organizations/api/organization.api";
import { Category, Organization } from "@/app/(main)/organizations/models/organization.model";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { useEffect, useRef, useState } from "react";
import { applicantTemplate } from "@/app/(main)/applicants/models/applicant.template";
import { Toast } from "primereact/toast";
import { Collaborator, CollaboratorStatus } from "../models/collaborator.model";


interface CollaboratorDialogProps {
    collaborator: Collaborator;
    setCollaborator: (collaborator: Collaborator) => void;
    visible: boolean;
    onAdd: () => Promise<void>;
    onHide: () => void;
}

export default function CollaboratorDialog({ collaborator, setCollaborator, visible, onHide, onAdd }: CollaboratorDialogProps) {

    const [scope, setScope] = useState<Category>();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [workspace, setWorkspace] = useState<Organization>();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchOrganizations = async () => {
            try {
                if (!scope) return;
                const type = scopeToOrganizationUnit[scope];
                if (type) {
                    const data = await OrganizationApi.getOrganizations({ type });
                    if (isMounted) {
                        setOrganizations(data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch organizations:", err);
            }
        };
        fetchOrganizations();
        return () => {
            isMounted = false;
        };
    }, [scope]);

    useEffect(() => {
        let isMounted = true;
        const fetchApplicants = async () => {
            try {
                if (!workspace) return;
                const data = await ApplicantApi.getApplicants({ organization: workspace._id });
                if (isMounted) {
                    setApplicants(data);
                }
            } catch (err) {
                console.error("Failed to fetch applicants:", err);
            }
        };
        fetchApplicants();
        return () => {
            isMounted = false;
        };
    }, [workspace]);

    const addCollaborator = async () => {
        try {
            await onAdd();
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Collaborator ${collaborator._id ? 'updated' : 'created'}`,
                life: 2000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save collaborator',
                detail: '' + err,
                life: 3000
            });
        }
    }


    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={addCollaborator} />
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
                {!collaborator._id ? <>
                    <div className="field">
                        <label htmlFor="scope">Scope</label>
                        <Dropdown
                            id="scope"
                            value={scope}
                            options={Object.values(Category).map(g => ({ label: g, value: g }))}
                            onChange={(e) =>
                                setScope(e.value)
                            }
                            placeholder="Select Scope"
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="workspace">Workspace</label>
                        <Dropdown
                            id="workspace"
                            value={workspace}
                            options={organizations}
                            onChange={(e) =>
                                setWorkspace(e.value)
                            }
                            optionLabel="name"
                            placeholder="Select a Workspace"
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="applicant">Collaborator</label>
                        <Dropdown
                            id="applicant"
                            value={collaborator.applicant}
                            options={applicants}
                            onChange={(e) =>
                                setCollaborator({ ...collaborator, applicant: e.value })
                            }
                            dataKey="_id"
                            optionLabel="first_name"
                            itemTemplate={(option) => applicantTemplate(option)}
                            valueTemplate={(option) =>
                                option
                                    ? applicantTemplate(option)
                                    : <span className="p-placeholder">Select a Collaborator</span>
                            }
                            placeholder="Select a Collaborator"
                        //className={classNames({ 'p-invalid': submitted && !scope })}
                        />
                    </div>

                </> :
                    <>
                        <div className="field">
                            <label htmlFor="status">Status</label>
                            <Dropdown
                                id="status"
                                value={collaborator.status}
                                options={Object.values(CollaboratorStatus).map(s => ({ label: s, value: s }))}
                                onChange={(e) =>
                                    setCollaborator({ ...collaborator, status: e.value })
                                }
                            />
                        </div>
                    </>}

            </Dialog>
        </>

    );
}
