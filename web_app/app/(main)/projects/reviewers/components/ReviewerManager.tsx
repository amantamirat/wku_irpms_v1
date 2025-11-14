import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import ConfirmDialog from "@/components/ConfirmationDialog";
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

interface ReviewerManagerProps {
    applicant?: Applicant;
    projectStage?: ProjectStage;
}

const ReviewerManager = ({ applicant, projectStage }: ReviewerManagerProps) => {
    const emptyReviewer: Reviewer = {
        applicant: applicant ?? undefined,
        projectStage: projectStage ?? undefined,
        status: ReviewerStatus.pending
    };

    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [reviewer, setReviewer] = useState<Reviewer>(emptyReviewer);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);

    useEffect(() => {
        const fetchReviewers = async () => {
            try {
                const options: GetReviewersOptions = {};
                options.applicant = applicant ? applicant._id : undefined;
                options.projectStage = projectStage ? projectStage._id : undefined;
                const data = await ReviewerApi.getReviewers(options);
                setReviewers(data);
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
                <ResultManager reviewer={rowData} />
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
                            visible={showSaveDialog}
                            reviewer={reviewer}
                            onCompelete={onSaveCompelete}
                            onHide={hideDialogs}
                        />}

                    {reviewer && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            title={String((reviewer.applicant as any)?.first_name)}
                            onConfirmAsync={deleteReviewer}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default ReviewerManager;