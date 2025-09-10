import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Project } from "../models/project.model";

interface ProjectInfoStepProps {
    project: Project;
    setProject: (project: Project) => void;
}

export default function ProjectInfoStep({ project, setProject }: ProjectInfoStepProps) {
    return (
        <div className="p-fluid formgrid grid">
            {!project.call &&
                <div className="field col-12">
                    <label htmlFor="call">Call</label>
                    <InputText
                        id="call"
                        value={project.title}
                        onChange={(e) => setProject({ ...project, title: e.target.value })}
                        required
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
