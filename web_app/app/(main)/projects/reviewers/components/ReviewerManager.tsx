import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableExpandedRows } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import ResultManager from "../../results/components/ResultManager";
import { ProjectStage } from "../../stages/models/stage.model";
import { GetReviewersOptions, ReviewerApi } from "../api/reviewer.api";
import { Reviewer, ReviewerStatus } from "../models/reviewer.model";
import SaveReviewerDialog from "./SaveReviewerDialog";
import ErrorComponent from "@/components/ErrorComponent";
import Badge from "@/templates/Badge";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";

interface ReviewerManagerProps {
    applicant?: Applicant;
    projectStage?: ProjectStage;
}

const ReviewerManager = ({ applicant, projectStage }: ReviewerManagerProps) => {

    const emptyReviewer: Reviewer = {
        applicant: applicant ?? undefined,
        projectStage: projectStage ?? undefined,
        weight: 1
    };

    const { getLinkedApplicant } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    const loggedApplicantId = linkedApplicant?._id ?? linkedApplicant;
    const { hasPermission } = useAuth();
    const canApprove = hasPermission([PERMISSIONS.REVIEWER.APPROVE]);
    const canDelete = hasPermission([PERMISSIONS.REVIEWER.DELETE]);
    const canEdit = hasPermission([PERMISSIONS.REVIEWER.UPDATE]);
    const canCreate = hasPermission([PERMISSIONS.REVIEWER.CREATE]);

    const confirm = useConfirmDialog();
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [reviewer, setReviewer] = useState<Reviewer>(emptyReviewer);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);

    useEffect(() => {
        const fetchReviewers = async () => {
            try {
                const options: GetReviewersOptions = {};
                options.applicant = applicant ? applicant._id : undefined;
                options.projectStage = projectStage ? projectStage._id : undefined;
                const data = await ReviewerApi.getReviewers(options);
                const processed = data.map((r: Reviewer) => ({
                    ...r,
                    applicant: applicant ?? r.applicant,
                    projectStage: projectStage ?? r.projectStage,
                }));
                setReviewers(processed);
            } catch (err: Error | any) {
                setError("Failed to fetch reviewers." + (err.message || ""));
            }
        };
        fetchReviewers();
    }, [applicant, projectStage]);

    if (error) {
        return (
            <ErrorComponent errorMessage={error} />
        );
    }

    const onSaveCompelete = (savedReviewer: Reviewer) => {
        let _reviewers = [...reviewers];
        const index = _reviewers.findIndex((r) => r._id === savedReviewer._id);
        if (index !== -1) {
            _reviewers[index] = { ...savedReviewer };
        } else {
            _reviewers.push({ ...savedReviewer });
        }
        setReviewers(_reviewers);
        hideSaveDialog();
    };

    const deleteReviewer = async (row: Reviewer) => {
        const deleted = await ReviewerApi.deleteReviewer(row);
        if (deleted) {
            setReviewers(reviewers.filter((c) => c._id !== row._id));
        }
    };

    const updateStatus = async (row: Reviewer, next: ReviewerStatus) => {
        try {
            const updated = await ReviewerApi.updateReviewer({ _id: row._id, status: next });
            setReviewers(prev =>
                prev.map(r => r._id === updated._id ? { ...updated, applicant: row.applicant, projectStage: row.projectStage } : r)
            );
        } catch (err: any) {
            throw err;
        }
    };


    const hideSaveDialog = () => {
        setReviewer(emptyReviewer);
        setShowSaveDialog(false);
    }

    const startToolbarTemplate = () => {
        if (!canCreate) {
            return null;
        }
        return (
            <div className="my-2">
                <Button label="New Reviewer" icon="pi pi-plus" severity="success" className="mr-2"
                    onClick={() => {
                        setReviewer(emptyReviewer);
                        setShowSaveDialog(true);
                    }}
                />
            </div>
        );
    }

    const statusBodyTemplate = (rowData: Reviewer) => {
        return (
            <Badge type="status" value={rowData.status ?? 'Unknown'} />
        );
    };

    const stateTransitionTemplate = (rowData: Reviewer) => {
        const state = rowData.status;
        const isOwner = (rowData?.applicant as any)._id === loggedApplicantId;
        // const isActiveReviewer = isOwner && reviewer?.status === ReviewerStatus.active;
        return (
            <div className="flex gap-2">
                {isOwner && (<>
                    {/* pending → active */}
                    {state === ReviewerStatus.pending && (
                        <Button
                            label="Activate"
                            icon="pi pi-check"
                            severity="success"
                            size="small"
                            onClick={() => {
                                confirm.ask({
                                    operation: 'activate',
                                    onConfirmAsync: () => updateStatus(rowData, ReviewerStatus.active)
                                });
                            }}
                        />
                    )}

                    {/* active → pending*/}
                    {state === ReviewerStatus.active && (
                        <>
                            <Button
                                label="Pend"
                                icon="pi pi-arrow-left"
                                severity="warning"
                                size="small"
                                onClick={() => {
                                    confirm.ask({
                                        operation: 'pend',
                                        onConfirmAsync: () => updateStatus(rowData, ReviewerStatus.pending)
                                    });
                                }}
                            />
                        </>
                    )}
                    {
                        /*
                         
                    {state === ReviewerStatus.active && (
                        <Button
                            label="Submit"
                            icon="pi pi-check"
                            size="small"
                            severity="success"
                            onClick={() => {
                                confirm.ask({
                                    operation: 'submit',
                                    onConfirmAsync: () => updateStatus(reviewer, ReviewerStatus.submitted)
                                });
                            }}
                        />
                    )}
                    
                    {state === ReviewerStatus.submitted && (
                        <Button
                            label="Recall Submission"
                            icon="pi pi-arrow-left"
                            size="small"
                            severity="warning"
                            onClick={() => {
                                confirm.ask({
                                    operation: 'Recall Submission',
                                    onConfirmAsync: () => updateStatus(reviewer, ReviewerStatus.active)
                                });
                            }}
                        />
                    )}
                         */
                    }

                </>)}
                {canApprove && (<>
                    {/* submitted → approved */}
                    {state === ReviewerStatus.submitted && (
                        <Button
                            label="Approve"
                            icon="pi pi-check-circle"
                            severity="info"
                            size="small"
                            onClick={() => confirm.ask({
                                operation: 'Approve',
                                onConfirmAsync: () => updateStatus(rowData, ReviewerStatus.approved)
                            })}
                        />)}
                    {/* approved → submitted */}
                    {state === ReviewerStatus.approved && (
                        <Button
                            label="Revert"
                            icon="pi pi-undo"
                            severity="warning"
                            size="small"
                            onClick={() => confirm.ask({
                                operation: 'revert to submitted',
                                onConfirmAsync: () => updateStatus(rowData, ReviewerStatus.submitted)
                            })}
                        />
                    )}
                </>)}
            </div>
        );
    }

    const actionBodyTemplate = (rowData: Reviewer) => {
        if (!canDelete) return null;

        const state = rowData.status;

        return (
            <>
                {canEdit &&
                    <Button icon="pi pi-pencil"
                        rounded
                        severity="success"
                        className="p-button-rounded p-button-text"
                        style={{ fontSize: '1.2rem' }} onClick={() => {
                            setReviewer(rowData);
                            setShowSaveDialog(true);
                        }} />
                }
                {canDelete &&
                    <Button
                        icon="pi pi-trash"
                        rounded
                        severity="warning"
                        className="p-button-rounded p-button-text"
                        style={{ fontSize: '1.2rem' }}
                        onClick={() => {
                            confirm.ask({
                                item: String((rowData.applicant as any)?.first_name),
                                onConfirmAsync: () => deleteReviewer(rowData)
                            });
                        }}
                    />
                }

            </>
        );
    };



    const resultExpansionTemplate = (rowData: Reviewer) => {
        return (
            <div className="p-3">
                <ResultManager reviewer={rowData} updateReviewerStatus={updateStatus} />
            </div>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    {(canCreate && projectStage) && <Toolbar className="mb-4" start={startToolbarTemplate} />}
                    <DataTable
                        value={reviewers}
                        selection={reviewer}
                        onSelectionChange={(e) => setReviewer(e.value as Reviewer)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        emptyMessage="No reviewers found."
                        scrollable
                        tableStyle={{ minWidth: '50rem' }}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={resultExpansionTemplate}
                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        {applicant &&
                            <Column
                                field="projectStage.stage.name"
                                header="Stage"
                                sortable
                            />
                        }
                        {applicant &&
                            <Column
                                field="projectStage.project.title"
                                header="Project"
                                sortable
                                headerStyle={{ minWidth: '15rem' }}
                            />
                        }
                        {projectStage &&
                            <Column
                                field="applicant.first_name"
                                header="Reviewer"
                                body={(rowData) => `${rowData.applicant?.first_name ?? ''} ${rowData.applicant?.last_name ?? ''}`}
                                sortable
                                headerStyle={{ minWidth: '15rem' }}
                            />
                        }
                        <Column field="score" header="Score" sortable />
                        <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                        <Column body={stateTransitionTemplate} />
                        <Column body={actionBodyTemplate} />
                    </DataTable>

                    {reviewer && projectStage &&
                        <SaveReviewerDialog
                            visible={showSaveDialog}
                            reviewer={reviewer}
                            onCompelete={onSaveCompelete}
                            onHide={hideSaveDialog}
                        />}
                </div>
            </div>
        </div>
    );
}

export default ReviewerManager;