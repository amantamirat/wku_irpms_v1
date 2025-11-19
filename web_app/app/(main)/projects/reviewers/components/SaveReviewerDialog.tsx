import { ApplicantApi } from "@/app/(main)/applicants/api/applicant.api";
import { Applicant, applicantUnits } from "@/app/(main)/applicants/models/applicant.model";
import { applicantTemplate } from "@/app/(main)/applicants/models/applicant.template";
import { OrganizationApi } from "@/app/(main)/organizations/api/organization.api";
import { Organization, OrganizationalUnit } from "@/app/(main)/organizations/models/organization.model";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { ReviewerApi } from "../api/reviewer.api";
import { Reviewer, validateReviewer } from "../models/reviewer.model";
import { InputNumber } from "primereact/inputnumber";

interface ReviewerDialogProps {
    visible: boolean;
    reviewer: Reviewer;
    onCompelete?: (savedReviewer: Reviewer) => void;
    onHide: () => void;
}

export default function SaveReviewerDialog({ visible, reviewer, onCompelete, onHide }: ReviewerDialogProps) {

    const toast = useRef<Toast>(null);
    const [scope, setScope] = useState<OrganizationalUnit>();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [workspace, setWorkspace] = useState<Organization>();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [localReviewer, setLocalReviewer] = useState(reviewer || {});

    useEffect(() => {
        setLocalReviewer(reviewer || {});
    }, [reviewer]);

    useEffect(() => {
        let isMounted = true;
        const fetchOrganizations = async () => {
            try {
                if (!scope) return;
                //const type = scopeToOrganizationUnit[scope];
                if (scope) {
                    const data = await OrganizationApi.getOrganizations({ type: scope });
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
            const validation = validateReviewer(localReviewer);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            let saved: Reviewer;
            if (localReviewer._id) {
                saved = await ReviewerApi.updateReviewer({ _id: localReviewer._id, weight: localReviewer.weight });
                //throw new Error("Updating reviewer is not allowed.");
            } else {
                saved = await ReviewerApi.createReviewer(localReviewer);
            }
            saved = {
                ...saved,
                projectStage: localReviewer.projectStage,
                applicant: localReviewer.applicant
            };
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'Reviewer Saved',
                life: 2000
            });
            if (onCompelete) {
                setTimeout(() => onCompelete(saved), 2000);
            }
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
                {!reviewer._id && <>
                    <div className="field">
                        <label htmlFor="scope">Scope</label>
                        <Dropdown
                            id="scope"
                            value={scope}
                            options={Object.values(applicantUnits).map(g => ({ label: g, value: g }))}
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
                            value={localReviewer.applicant}
                            options={applicants}
                            onChange={(e) =>
                                setLocalReviewer({ ...localReviewer, applicant: e.value })
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
                </>}
                <div className="field">
                    <label htmlFor="weight">Weight</label>
                    <InputNumber
                        id="weight"
                        value={localReviewer.weight}
                        onValueChange={(e) => setLocalReviewer({ ...localReviewer, weight: e.value ?? 1 })}
                        min={0}
                        placeholder="Enter weight"
                    />
                </div>

            </Dialog>
        </>
    );
}
