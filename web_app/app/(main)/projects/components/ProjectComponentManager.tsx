'use client';

import { useMemo } from "react";
import { createEntityManager } from "@/components/data-table/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { Project } from "../models/project.model";
import { ProjectComponentApi } from "../phases/api/phase-component.api";
import { ProjectComponent } from "../phases/models/phase-component.model";
import SaveProjectComponent from "./SaveProjectComponent";

interface ProjectComponentManagerProps {
    project: Project;
    enableEditing?: boolean;
}

const ProjectComponentManager = ({
    project,
    enableEditing = false
}: ProjectComponentManagerProps) => {
    const Manager = useMemo(
        () => createEntityManager<ProjectComponent, { project?: string }>({
            title: "Project Components",
            itemName: "Component",
            api: ProjectComponentApi,
            permissionPrefix: "phaseActivity",
            query: () => ({ project: project._id }),
            columns: [
                {
                    header: "Component",
                    field: "title",
                    sortable: true,
                    body: (component: ProjectComponent) => (
                        <div>
                            <span className="font-semibold">{component.title}</span>
                            {component.description && (
                                <small className="block text-600 mt-1">{component.description}</small>
                            )}
                        </div>
                    )
                },
                {
                    header: "Contributors",
                    field: "contributors",
                    body: (component: ProjectComponent) => (
                        <span>
                            {(component.contributors || []).map(member =>
                                typeof member === "object" ? member.name : member
                            ).join(", ") || "None assigned"}
                        </span>
                    )
                },
                {
                    header: "Progress",
                    field: "status",
                    body: (component: ProjectComponent) => (
                        <div className="flex align-items-center gap-2">
                            <MyBadge type="status" value={component.status || "planned"} />
                            <small className="text-600">
                                {component.activities?.length || 0} activities
                            </small>
                        </div>
                    )
                }
            ],
            createNew: () => ({
                project: project._id,
                title: "",
                contributors: []
            }),
            SaveDialog: SaveProjectComponent,
            hideSearch: true,
            hideDefaultActions: !enableEditing
        }),
        [project._id, enableEditing]
    );

    return <Manager key={project._id} />;
};

export default ProjectComponentManager;
