import { Call } from "@/app/(main)/calls/models/call.model";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { useState } from "react";
import { Project } from "../../models/project.model";

interface ProjectFormProps {
    calls?: Call[];
    project: Project;
    setProject: (project: Project) => void;    
}

const ProjectForm = ({ calls, project, setProject }: ProjectFormProps) => {

    const [showCallDropdown] = useState(() => !project.call);

    return (
        <div className="p-fluid formgrid grid">
            {showCallDropdown && 
                <div className="field col-12">
                    <label htmlFor="call">Call</label>
                    <Dropdown
                        id="call"
                        dataKey="_id"
                        options={calls}
                        value={project.call}
                        onChange={(e) => {
                            setProject({ ...project, call: e.value });
                        }}
                        required
                        optionLabel="title"
                        placeholder="Select a Call"
                        className="w-full"
                    />
                </div>
            }
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

