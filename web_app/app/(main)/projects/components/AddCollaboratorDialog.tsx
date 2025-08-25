import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { useEffect, useState } from "react";
import { ApplicantApi } from "../../applicants/components/api/applicant.api";
import { Applicant, scopeToOrganizationUnit } from "../../applicants/models/applicant.model";
import { OrganizationApi } from "../../organizations/api/organization.api";
import { Category, Organization } from "../../organizations/models/organization.model";
import { Collaborator } from "../models/project.model";


interface AddCollaboratorDialogProps {
    collaborator: Collaborator;
    setCollaborator: (collaborator: Collaborator) => void;
    visible: boolean;
    onSave: () => void;
    onHide: () => void;
}

export default function AddCollaboratorDialog({ collaborator, setCollaborator, visible, onHide, onSave }: AddCollaboratorDialogProps) {

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
            <Button label="Save" icon="pi pi-check" text onClick={onSave} />
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
                //className={classNames({ 'p-invalid': submitted && !scope })}
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
                //className={classNames({ 'p-invalid': submitted && !scope })}
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
                    optionLabel="first_name"
                    placeholder="Select a Collaborator"
                //className={classNames({ 'p-invalid': submitted && !scope })}
                />
            </div>

        </Dialog>
    );
}
