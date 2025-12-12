import { Divider } from "primereact/divider";
import { TabView, TabPanel } from "primereact/tabview";
import { Project } from "../models/project.model";
import CollaboratorManager from "../collaborators/components/CollaboratorManager";
import ProjectThemeManager from "../themes/components/ThemeManager";
import PhaseManager from "../phases/components/PhaseManager";
import { PhaseType } from "../phases/models/phase.model";
import ProjectStageManager from "../stages/components/ProjectStageManager";


interface ProjectDetailProps {
    project: Project;
    updateProjectStatus?: (project: Project) => void;
}

export default function ProjectDetail({ project, updateProjectStatus }: ProjectDetailProps) {
    return (
        <div className="project-detail">
            <div className="header">
                <h2>{project.title}</h2>
                <p>Created At: {new Date(project.createdAt!).toLocaleDateString()}</p>
                <p>Created By: {(project.leadPI as any).name}</p>
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
                    <TabPanel header="Phases">
                        <PhaseManager project={project} phaseType={PhaseType.phase} />
                    </TabPanel>
                    <TabPanel header="Themes" disabled>
                        <ProjectThemeManager project={project} />
                    </TabPanel>
                    <TabPanel header="Documents">
                        <ProjectStageManager project={project} updateProjectStatus={updateProjectStatus} />
                    </TabPanel>
                </TabView>
            </>
        </div>
    );
}