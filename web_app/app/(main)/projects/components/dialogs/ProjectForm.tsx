import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Project } from "../../models/project.model";
import { useEffect, useState } from "react";
import { Call, CallStatus } from "@/app/(main)/calls/models/call.model";
import { CallApi } from "@/app/(main)/calls/api/call.api";
import { Dropdown } from "primereact/dropdown";

interface ProjectFormProps {
    project: Project;
    setProject: (project: Project) => void;
}

const ProjectForm = ({ project, setProject }: ProjectFormProps) => {

    const [showCallDropdown, setShowCallDropdown] = useState(() => !project.call);
    const [calls, setCalls] = useState<Call[]>([]);

    useEffect(() => {
        const fetchCalls = async () => {
            const data = await CallApi.getCalls({ status: CallStatus.active });
            setCalls(data);
        };
        if (!project.call) {
            fetchCalls();
        }

    }, [project.call]);

    return (
        <div className="p-fluid formgrid grid">
            {(showCallDropdown) && <>

                <div className="field col-12">
                    <label htmlFor="call">Call</label>
                    <Dropdown
                        id="call"
                        dataKey="_id"
                        options={calls}
                        value={project.call}
                        onChange={(e) => {
                            setProject({ ...project, call: e.value });
                            setShowCallDropdown(true);
                        }}
                        required
                        optionLabel="title"
                        placeholder="Select a Call"
                        className="w-full"
                    />
                </div>

            </>}
            <div className="field col-12">
                <label htmlFor="title">Title</label>
                <InputText
                    id="title"
                    value={project.title}
                    onChange={(e) => setProject({ ...project, title: e.target.value })}
                    required
                    className="w-full"
                />
            </div>
            <div className="field col-12">
                <label htmlFor="description">Description</label>
                <InputTextarea
                    id="description"
                    value={project.summary ?? ""}
                    onChange={(e) => setProject({ ...project, summary: e.target.value })}
                    rows={5}
                    autoResize
                    placeholder="Enter Project summary ..."
                    className="w-full"
                />
            </div>
        </div>
    );
}

export default ProjectForm;

