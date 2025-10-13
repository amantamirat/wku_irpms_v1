import { ApplicantApi } from "@/app/(main)/applicants/api/applicant.api";
import { Applicant, scopeToOrganizationUnit } from "@/app/(main)/applicants/models/applicant.model";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Reviewer, ReviewerStatus, validateReviewer } from "../models/reviewer.model";
import { OrganizationApi } from "@/app/(main)/organizations/api/organization.api";
import { Category, Organization } from "@/app/(main)/organizations/models/organization.model";
import { applicantTemplate } from "@/app/(main)/applicants/models/applicant.template";

interface ReviewerDialogProps {
    reviewer: Reviewer;
    setReviewer: (reviewer: Reviewer) => void;
    visible: boolean;
    onSave: () => Promise<void>;
    onHide: () => void;
}

export default function SaveReviewerDialog({ reviewer, setReviewer, visible, onHide, onSave }: ReviewerDialogProps) {

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

    const saveReviewer = async () => {
        try {
            const result = validateReviewer(reviewer);
            if (!result.valid) {
                throw new Error(result.message);
            }
            await onSave();
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'Reviewer Saved',
                life: 2000
            });
            setTimeout(() => onHide(), 2000);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save reviewer',
                detail: '' + err,
                life: 2000
            });
        } finally {
            // Any cleanup if necessary
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveReviewer} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={'Reviewer Detail'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {!reviewer._id ? <>
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
                        <label htmlFor="applicant">Applicant</label>
                        <Dropdown
                            id="applicant"
                            value={reviewer.applicant}
                            options={applicants}
                            onChange={(e) =>
                                setReviewer({ ...reviewer, applicant: e.value })
                            }
                            dataKey="_id"
                            optionLabel="first_name"
                            itemTemplate={(option) => applicantTemplate(option)}
                            valueTemplate={(option) =>
                                option
                                    ? applicantTemplate(option)
                                    : <span className="p-placeholder">Select a Collaborator</span>
                            }
                            placeholder="Select an Applicant"
                        />
                    </div>
                </> :
                    <>
                        <div className="field">
                            <label htmlFor="status">Status</label>
                            <Dropdown
                                id="status"
                                value={reviewer.status}
                                options={Object.values(ReviewerStatus).map(s => ({ label: s, value: s }))}
                                onChange={(e) =>
                                    setReviewer({ ...reviewer, status: e.value })
                                }
                            />
                        </div>
                    </>}
            </Dialog>
        </>
    );
}
