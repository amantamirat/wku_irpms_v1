'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import UploadForm from "../../components/UploadForm";
import { Project } from "../../models/project.model";
import { ProjectDoc, validateProjectDoc } from "../models/document.model";
import { StageApi } from "@/app/(main)/calls/stages/api/call.stage.api";
import { Stage } from "@/app/(main)/calls/stages/models/call.stage.model";
import { ProjectDocApi } from "../api/project.doc.api";

interface SaveProjectStageDialogProps {
    project?: Project;
    visible: boolean;
    projectDoc: ProjectDoc;
    onComplete?: (saved: ProjectDoc) => void;
    onHide: () => void;
}

const SaveProjectStageDialog = ({
    project,
    visible,
    projectDoc,
    onComplete,
    onHide,
}: SaveProjectStageDialogProps) => {

    const [localProjectStage, setLocalProjectStage] = useState<ProjectDoc>({ ...projectDoc });
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
            if (localProjectStage._id) {
                return;
            }
            const created = await ProjectDocApi.create(localProjectStage);

            saved = {
                ...created,
                project: localProjectStage.project,
                stage: localProjectStage.stage
            };

            toast.current?.show({
                severity: "success",
                summary: "Successful",
                detail: "Project document submitted successfully",
                life: 2000,
            });

           if (onComplete) setTimeout(() => onComplete(saved), 2000);

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
            setLocalProjectStage({ ...projectDoc });
        }
    }, [visible]);

    /*
    useEffect(() => {
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

    }, [projectDoc, project?.call]);
*/
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
                header="Project Doc Details"
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
