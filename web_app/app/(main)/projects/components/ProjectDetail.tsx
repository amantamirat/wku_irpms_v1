import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { TabView, TabPanel } from "primereact/tabview";
import { Project } from "../models/project.model";
import CollaboratorManager from "../collaborators/components/CollaboratorManager";
import ThemeManager from "../themes/components/ThemeManager";
import PhaseManager from "../phases/components/PhaseManager";
import { PhaseType } from "../phases/models/phase.model";
import ProjectStageManager from "../stages/components/StageManager";


interface ProjectDetailProps {
    project: Project;
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
    return (
        <div className="project-detail">
            <div className="header">
                <h2>{project.title}</h2>
                <p>Created At: {new Date(project.createdAt!).toLocaleDateString()}</p>
                <p>Created By: {project.createdBy as string}</p>
                <p>Status: <span className={`project-badge status-${project.status}`}>{project.status}</span></p>
            </div>
            <Divider />
            <div className="summary">
                <h4>{project.summary ? "Summary" : ""}</h4>
                <p>{project.summary}</p>
            </div>
            <>
                <TabView>
                    <TabPanel header="Collaborators">
                        <CollaboratorManager project={project} />
                    </TabPanel>
                    <TabPanel header="Themes">
                        <ThemeManager project={project} />
                    </TabPanel>
                    <TabPanel header="Phases">
                        <PhaseManager project={project} phaseType={PhaseType.phase} />
                    </TabPanel>
                    <TabPanel header="Documents">
                        <ProjectStageManager project={project} />
                    </TabPanel>
                </TabView>
            </>
        </div>
    );
}