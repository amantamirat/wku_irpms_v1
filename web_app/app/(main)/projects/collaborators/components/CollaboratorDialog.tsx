import { ApplicantApi } from "@/app/(main)/applicants/api/applicant.api";
import { Applicant, scopeToOrganizationUnit } from "@/app/(main)/applicants/models/applicant.model";
import { OrganizationApi } from "@/app/(main)/organizations/api/organization.api";
import { Category, Organization } from "@/app/(main)/organizations/models/organization.model";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { useEffect, useState } from "react";
import { Collaborator } from "../../models/project.model";
import { applicantTemplate } from "@/app/(main)/applicants/models/applicant.template";


interface CollaboratorDialogProps {
    collaborator: Collaborator;
    setCollaborator: (collaborator: Collaborator) => void;
    visible: boolean;
    onAdd: () => void;
    onHide: () => void;
}

export default function CollaboratorDialog({ collaborator, setCollaborator, visible, onHide, onAdd }: CollaboratorDialogProps) {

    const [scope, setScope] = useState<Category>();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [workspace, setWorkspace] = useState<Organization>();
    const [applicants, setApplicants] = useState<Applicant[]>([]);

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



    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Add" icon="pi pi-check" text onClick={onAdd} />
        </>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '600px' }}
            header={'Add Collaborator'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={onHide}
        >
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

        </Dialog>
    );
}
