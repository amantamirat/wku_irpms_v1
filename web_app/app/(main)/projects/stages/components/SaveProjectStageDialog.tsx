'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import UploadForm from "../../components/UploadForm";
import { Project } from "../../models/project.model";
import { ProjectStage, validateProjectStage } from "../models/stage.model";
import { StageApi } from "@/app/(main)/calls/stages/api/stage.api";
import { Stage } from "@/app/(main)/calls/stages/models/stage.model";
import { ProjectStageApi } from "../api/project.stage.api";

interface SaveProjectStageDialogProps {
    project?: Project;
    visible: boolean;
    projectStage: ProjectStage;
    onComplete?: (saved: ProjectStage, syncedProject?: Project) => void;
    onHide: () => void;
}

const SaveProjectStageDialog = ({
    project,
    visible,
    projectStage,
    onComplete,
    onHide,
}: SaveProjectStageDialogProps) => {

    const [localProjectStage, setLocalProjectStage] = useState<ProjectStage>({ ...projectStage });
    const [stages, setStages] = useState<Stage[]>([]);
    const toast = useRef<Toast>(null);

    const updateField = (field: keyof ProjectStage, value: any) => {
        setLocalProjectStage({ ...localProjectStage, [field]: value });
    };

    const saveProjectStage = async () => {
        try {
            const validation = validateProjectStage(localProjectStage);
            if (!validation.valid) throw new Error(validation.message);

            let saved: ProjectStage;
            let syncedProject: Project | undefined = undefined;
            if (localProjectStage._id) {
                saved = await ProjectStageApi.updateProjectStage(localProjectStage);
            } else {
                const { created, syncedProject: sp } = await ProjectStageApi.createProjectStage(localProjectStage);
                saved = created;
                syncedProject = sp;
            }

            saved = { ...saved, project: localProjectStage.project, stage: localProjectStage.stage };

            toast.current?.show({
                severity: "success",
                summary: "Successful",
                detail: "Project stage saved successfully",
                life: 2000,
            });

            if (onComplete) onComplete(saved, syncedProject);
            //onHide()
        } catch (err) {
            toast.current?.show({
                severity: "error",
                summary: "Failed to save project stage",
                detail: String(err),
                life: 3000,
            });
        }
    };

    useEffect(() => {
        if (visible) {
            setLocalProjectStage({ ...projectStage });
            const fetchStages = async () => {
                try {
                    const data = await StageApi.getStages({
                        cycle: (project?.cycle as any)?._id,
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
    }, [visible, projectStage, project?.cycle]);

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
                        <div className="field">
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
