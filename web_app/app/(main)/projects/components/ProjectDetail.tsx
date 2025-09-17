import { Card } from "primereact/card";
import { Divider } from "primereact/divider";
import { TabView, TabPanel } from "primereact/tabview";
import { Project } from "../models/project.model";

interface ProjectDetailProps {
    project: Project;
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
    return (
        <div className="p-4">

            <Card title={project.title}>
                {/*  <h2 className="text-xl font-bold">{project.title}</h2> */}
                {<p className="text-sm text-gray-500">Created At: {new Date(project.createdAt!).toLocaleDateString()}</p>}
                <p className="text-sm text-gray-700">Created By: {project.createdBy as string}</p>
                <p className="text-sm text-gray-700">Status: <span className={`project-badge status-${project.status}`}>{project.status}</span></p>
                <Divider />
                <p>{project.summary}</p>
                <>
                    <TabView>
                        <TabPanel header="Collaborators">
                            {/* Collaborators list / Accept-Decline UI */}
                        </TabPanel>
                        <TabPanel header="Themes">
                            {/* Themes list / content */}
                        </TabPanel>
                        <TabPanel header="Phases">
                            {/* Phases / timeline */}
                        </TabPanel>
                    </TabView>
                </>
            </Card>





        </div>
    );
}