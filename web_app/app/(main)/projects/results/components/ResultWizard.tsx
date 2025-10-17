import { EvaluationApi } from "@/app/(main)/evals/api/evaluation.api";
import { EvalType, Evaluation, FormType } from "@/app/(main)/evals/models/eval.model";
import { Dialog } from "primereact/dialog";
import { Paginator, PaginatorPageChangeEvent } from "primereact/paginator";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { Result } from "../models/result.model";
import { Button } from "primereact/button";

interface ResultWizardProps {
    visible: boolean;
    onCancel: () => void;
}

const ResultWizard = ({ visible, onCancel }: ResultWizardProps) => {
    const toast = useRef<Toast>(null);
    const [criteria, setCriteria] = useState<Evaluation[]>([]);
    const [results, setResults] = useState<Result[]>([]);
    const [first, setFirst] = useState(0); // paginator index

    // Fetch criteria and build result array
    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                const data = await EvaluationApi.getEvaluations({ type: EvalType.criterion });
                setCriteria(data);
                // Initialize results array with same length as criteria
                const initialResults: Result[] = data.map((criterion) => ({
                    criterion,
                    score: 0,
                    comment: "",
                    evaluator: "" // fill in later if needed
                }));
                setResults(initialResults);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCriteria();
    }, []);



    const onHide = () => {
        setFirst(0);
        onCancel();
    };

    const nextPage = () => {
        setFirst(first + 1);
    };
    const prevPage = () => {
        setFirst(first - 1)
    };
    const onPageChange = (e: PaginatorPageChangeEvent) => {
        setFirst(e.first);
    };


    // Current criterion and its corresponding result
    const currentCriterion = criteria[first];
    const currentResult = results[first];

    // Handle score/comment change
    const updateResult = (field: keyof Result, value: any) => {
        const updated = [...results];
        updated[first] = { ...updated[first], [field]: value };
        setResults(updated);
    };

    const submit = async () => {
        try {
            toast.current?.show({
                severity: "success",
                summary: "Saved",
                detail: `All ${results.length} results captured.`,
                life: 2000,
            });
            console.log("Final results:", results);
        } catch (err) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: String(err),
            });
        }
    };

    const footer = (
        <div className="flex justify-content-center gap-2">
            {first === 0 && (
                <Button label="Cancel" icon="pi pi-times" outlined onClick={onHide} severity="danger" />
            )}
            {first > 0 && (
                <Button label="Back" icon="pi pi-angle-left" onClick={prevPage} outlined severity="secondary" />
            )}
            {first < criteria.length - 1 && (<Button label="Next" icon="pi pi-angle-right" onClick={nextPage} iconPos="right" outlined />
            )}
            {first === criteria.length - 1 && (
                <Button label="Submit" icon="pi pi-check" onClick={submit} outlined severity="success" />
            )}
        </div>
    );


    return (
        <>
            <Toast ref={toast} />
            <Dialog
                header="Evaluate Project"
                visible={visible}
                style={{ width: "800px" }}
                onHide={onHide}
                maximizable
                footer={footer}
            >
                {currentCriterion && currentResult ? (
                    <div className="p-fluid">
                        <h3 className="mb-3 text-center">{currentCriterion.title}</h3>

                        {
                            currentCriterion.form_type === FormType.open &&
                            <div className="field">
                                <label htmlFor="score">Score</label>
                                <InputNumber
                                    id="score"
                                    value={currentResult.score}
                                    onValueChange={(e) => updateResult("score", e.value ?? 0)}
                                    min={0}
                                    placeholder="Enter score"
                                />
                            </div>
                        }


                        <div className="field">
                            <label htmlFor="comment">Comment</label>
                            <InputTextarea
                                id="comment"
                                rows={3}
                                value={currentResult.comment}
                                onChange={(e) => updateResult("comment", e.target.value)}
                                autoResize
                                placeholder="Enter comment (optional)"
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-center">No criteria available.</p>
                )}

                {criteria.length > 0 && (
                    <>
                        <Paginator
                            first={first}
                            rows={1}
                            totalRecords={criteria.length}
                            onPageChange={onPageChange}
                            template="FirstPageLink PageLinks LastPageLink"
                            className="justify-content-center mt-4"
                        />
                    </>
                )}
            </Dialog>
        </>
    );
};

export default ResultWizard;
