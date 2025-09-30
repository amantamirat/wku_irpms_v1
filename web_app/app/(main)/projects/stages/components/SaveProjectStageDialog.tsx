import { Call } from "@/app/(main)/calls/models/call.model";
import { EvaluationApi } from "@/app/(main)/evals/api/eval.api";
import { EvalType, Evaluation } from "@/app/(main)/evals/models/eval.model";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { Project } from "../../models/project.model";
import { ProjectStage, validateProjectStage } from "../models/stage.model";
import UploadForm from "../../components/UploadForm";



interface SaveProjectStageDialogProps {
    project: Project;
    projectStage: ProjectStage;
    setProjectStage: (projectStage: ProjectStage) => void;
    visible: boolean;
    onAdd: () => Promise<void>;
    onHide: () => void;
}

export default function SaveProjectStageDialog({ project, projectStage, setProjectStage, visible, onAdd, onHide }: SaveProjectStageDialogProps) {

    const toast = useRef<Toast>(null);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [evaluaionStages, setEvaluationStages] = useState<Evaluation[]>([]);



    useEffect(() => {
        const fetchStages = async () => {
            const evaluation = (project.call as Call).evaluation;
            const evaluationId =
                typeof evaluation === "object" && evaluation !== null
                    ? (evaluation as any)._id
                    : evaluation;
            const data = await EvaluationApi.getEvaluations({
                type: EvalType.stage,
                parent: evaluationId
            });
            setEvaluationStages(data);
        };
        fetchStages();
    }, [project?.call]);


    const saveProjectStage = async () => {
        try {
            const result = validateProjectStage(projectStage);
            if (!result.valid) {
                setErrorMessage(result.message);
                return;
            }
            setErrorMessage(undefined);
            await onAdd();
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: "ProjectStage Saved.",
                life: 2000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save project theme',
                detail: '' + err,
                life: 3000
            });
        }
    }

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveProjectStage} />
        </>
    );

    const updateFile = (file: File) => {
        setProjectStage({ ...projectStage, ["file"]: file });
    }

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: "600px" }}
                header="ProjectStage Details"
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >

                <div className="field">
                    <label htmlFor="stage">Stage</label>
                    <Dropdown
                        id="stage"
                        value={projectStage.stage}
                        options={evaluaionStages}
                        onChange={(e) =>
                            setProjectStage({ ...projectStage, stage: e.value })
                        }
                        placeholder="Select Stage"
                        optionLabel="title"
                    />
                </div>

                <UploadForm onUpload={updateFile} />

                {errorMessage && (
                    <small className="p-error">{errorMessage}</small>
                )}
            </Dialog>
        </>
    );
}
