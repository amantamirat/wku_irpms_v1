import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableExpandedRows } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { Toast } from "primereact/toast";
import { useCallback, useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/ConfirmationDialog";
import { ReviewerApi, GetReviewersOptions } from "../api/reviewer.api";
import { Reviewer, ReviewerStatus } from "../models/reviewer.model";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { ProjectStage } from "../../stages/models/stage.model";
import SaveReviewerDialog from "./ReviewerDialog";
import ResultManager from "../../results/components/ResultManager";

interface ReviewerManagerProps {
    applicant?: Applicant;
    projectStage?: ProjectStage;
}

export default function ReviewerManager({ applicant, projectStage }: ReviewerManagerProps) {
    const emptyReviewer: Reviewer = {
        applicant: applicant ?? undefined,
        projectStage: projectStage ?? undefined,
        status: ReviewerStatus.pending
    };

    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [reviewer, setReviewer] = useState<Reviewer>(emptyReviewer);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);
    


    const fetchReviewers = useCallback(async () => {
        try {
            const options: GetReviewersOptions = {};
            options.applicant = applicant ? applicant._id : undefined;
            options.projectStage = projectStage ? projectStage._id : undefined;            
            const data = await ReviewerApi.getReviewers(options);
            setReviewers(data);
        } catch (err) {
            console.error("Failed to fetch reviewers:", err);
        }
    }, [applicant, projectStage]);

    useEffect(() => {
        fetchReviewers();
    }, [fetchReviewers]);

    const saveReviewer = async () => {
        let _reviewers = [...reviewers];
        if (reviewer._id) {
            const updated = await ReviewerApi.updateReviewer(reviewer);
            const index = _reviewers.findIndex((c) => c._id === reviewer._id);
            _reviewers[index] = { ...updated, applicant: reviewer.applicant, projectStage: reviewer.projectStage };
        } else {
            const created = await ReviewerApi.createReviewer(reviewer);
            _reviewers.push({ ...created, applicant: reviewer.applicant, projectStage: reviewer.projectStage });
        }
        setReviewers(_reviewers);
        hideDialogs();
    };

    const deleteReviewer = async () => {
        const deleted = await ReviewerApi.deleteReviewer(reviewer);
        if (deleted) {
            setReviewers(reviewers.filter((c) => c._id !== reviewer._id));
            hideDialogs();
        }
    };

    const hideDialogs = () => {
        setReviewer(emptyReviewer);
        setShowDeleteDialog(false);
        setShowSaveDialog(false);
    }

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New Reviewer" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setReviewer(emptyReviewer);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const statusBodyTemplate = (rowData: Reviewer) => (
        <span className={`reviewer-badge status-${rowData.status}`}>{rowData.status}</span>
    );

    const actionBodyTemplate = (rowData: Reviewer) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setReviewer(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setReviewer(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );

    // Row expansion template for results
    const resultExpansionTemplate = (rowData: Reviewer) => {
        return (
            <div className="p-3">
                <h6>
                    Results for Reviewer: 
                    {typeof rowData.applicant === "object" && rowData.applicant !== null
                        ? `${rowData.applicant.first_name ?? ""} ${rowData.applicant.last_name ?? ""}`
                        : ""}
                </h6>
                <ResultManager evaluator={rowData} />
            </div>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>
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
                        <Column
                            field="applicant.first_name"
                            header="Reviewer"
                            body={(rowData) => `${rowData.applicant?.first_name ?? ''} ${rowData.applicant?.last_name ?? ''}`}
                            sortable
                            headerStyle={{ minWidth: '15rem' }}
                        />
                        <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                    </DataTable>

                    {reviewer && projectStage &&
                        <SaveReviewerDialog
                            reviewer={reviewer}
                            setReviewer={setReviewer}
                            visible={showSaveDialog}
                            onSave={saveReviewer}
                            onHide={hideDialogs}
                        />}

                    {reviewer && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            selectedDataInfo={String((reviewer.applicant as any)?.first_name)}
                            onConfirmAsync={deleteReviewer}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
