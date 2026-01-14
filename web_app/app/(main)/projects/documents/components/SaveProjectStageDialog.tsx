'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import UploadForm from "../../components/UploadForm";
import { Project } from "../../models/project.model";
import { ProjectDoc, validateProjectDoc } from "../models/document.model";
import { StageApi } from "@/app/(main)/calls/stages/api/stage.api";
import { Stage } from "@/app/(main)/calls/stages/models/stage.model";
import { ProjectDocApi } from "../api/project.doc.api";

interface SaveProjectStageDialogProps {
    project?: Project;
    visible: boolean;
    projectStage: ProjectDoc;
    onComplete?: (saved: ProjectDoc, syncedProject?: Project) => void;
    onHide: () => void;
}

const SaveProjectStageDialog = ({
    project,
    visible,
    projectStage,
    onComplete,
    onHide,
}: SaveProjectStageDialogProps) => {

    const [localProjectStage, setLocalProjectStage] = useState<ProjectDoc>({ ...projectStage });
    const [stages, setStages] = useState<Stage[]>([]);
    const toast = useRef<Toast>(null);

    const updateField = (field: keyof ProjectDoc, value: any) => {
        setLocalProjectStage({ ...localProjectStage, [field]: value });
    };

    const saveProjectStage = async () => {
        try {
            const validation = validateProjectDoc(localProjectStage);
            if (!validation.valid) throw new Error(validation.message);

            let saved: ProjectDoc;
            let syncedProject: Project | undefined = undefined;
            if (localProjectStage._id) {
                return;
                // saved = await ProjectDocApi.updateProjectStage(localProjectStage);
            } else {
                const { created, syncedProject: sp } = await ProjectDocApi.createProjectStage(localProjectStage);
                saved = created;
                syncedProject = sp;
            }

            saved = {
                ...saved,
                project: localProjectStage.project,
                stage: localProjectStage.stage
            };

            toast.current?.show({
                severity: "success",
                summary: "Successful",
                detail: "Project document submitted successfully",
                life: 2000,
            });

            if (onComplete) onComplete(saved, syncedProject);
           
        } catch (err) {
            toast.current?.show({
                severity: "error",
                summary: "Failed to save project stage",
                detail: String(err),
                life: 2000,
            });
        }
    };

    useEffect(() => {
        if (visible) {
            setLocalProjectStage({ ...projectStage });
            const fetchStages = async () => {
                try {
                    const data = await StageApi.getStages({
                        call: project?.call,
                    });
                    setStages(data);
                } catch (err) {
                    toast.current?.show({
                        severity: "error",
                        summary: "Failed to fetch stages",
                        detail: String(err),
                        life: 3000,
                    });
                }
            };
            fetchStages();
        }
    }, [visible, projectStage, project?.call]);

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveProjectStage} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: "600px" }}
                header="Project Stage Details"
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {!localProjectStage._id &&
                    <>
                        {
                            /**
                             * 
                             * <div className="field">
                                <label htmlFor="stage">Stage</label>
                                <Dropdown
                                    id="stage"
                                    value={localProjectStage.stage}
                                    options={stages}
                                    onChange={(e) => updateField("stage", e.value)}
                                    placeholder="Select Stage"
                                    optionLabel="name"
                                />
                            </div>
                             */
                        }
                        <UploadForm
                            onUpload={(file) => updateField("file", file)}
                        />
                    </>
                }
            </Dialog>
        </>
    );
};

export default SaveProjectStageDialog;
