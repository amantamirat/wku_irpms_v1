'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import UploadForm from "../../components/UploadForm";
import { Project } from "../../models/project.model";
import { ProjectStage, StageStatus, validateProjectStage } from "../models/stage.model";
import { StageApi } from "@/app/(main)/cycles/stages/api/stage.api";
import { Stage } from "@/app/(main)/cycles/stages/models/stage.model";
import { ProjectStageApi } from "../api/stage.api";

interface SaveProjectStageDialogProps {
    project: Project;
    visible: boolean;
    projectStage: ProjectStage;
    onComplete?: (saved: ProjectStage) => void;
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

            if (localProjectStage._id) {
                saved = await ProjectStageApi.updateProjectStage(localProjectStage);
            } else {
                saved = await ProjectStageApi.createProjectStage({
                    ...localProjectStage,
                    project: project._id,
                });
            }

            toast.current?.show({
                severity: "success",
                summary: "Successful",
                detail: "Project stage saved successfully",
                life: 2000,
            });

            if (onComplete) onComplete(saved);
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
                        cycle: (project.cycle as any)?._id,
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
                {!localProjectStage._id ? (
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
                ) : (
                    <div className="field">
                        <label htmlFor="status">Status</label>
                        <Dropdown
                            id="status"
                            value={localProjectStage.status}
                            options={Object.values(StageStatus).map((s) => ({
                                label: s,
                                value: s,
                            }))}
                            onChange={(e) => updateField("status", e.value)}
                            placeholder="Select Status"
                        />
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default SaveProjectStageDialog;
