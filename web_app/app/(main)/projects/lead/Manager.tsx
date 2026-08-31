'use client';

import { User } from "@/app/(main)/users/models/user.model";
import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useMemo, useState } from "react";
import ProjectDetail from "../../projects/components/ProjectDetail";
import { ProjectApi } from "../api/project.api";
import { Project } from "../models/project.model";


interface ProjectManagerProps {
    user: User;
    enableEditing?: boolean;
}

const UserProjectManager = ({ user, enableEditing }: ProjectManagerProps) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(false);


    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const data = await ProjectApi.getAll({ leadPI: user});
                setProjects(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching projects", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [user]);

    // useMemo prevents component re-creation on every render cycle
    const Manager = useMemo(() => {
        return createEntityManager<Project>({
            //title: "Evaluations",
            itemName: "Project",
            api: ProjectApi,
            columns: [
                {
                    header: "Project Title",
                    field: "title",
                    body: (p: Project, options: any) => {
                        return <div className="truncate text-sm font-medium" title={p.title}
                            style={{ maxWidth: "350px" }}
                        >{p.title}</div>;

                    }
                },

                {
                    header: "Status",
                    field: "status",
                    sortable: true,
                    body: (r: Project) => (
                        <MyBadge type="status" value={r.status ?? "Unknown"} />
                    )
                }
            ],
            items: projects,

            permissionPrefix: "project",
            hideSearch: true,
            //disableEditRow: (row) => row.status !== ProjectStatus.accepted,
            //disableDeleteRow: (row) => row.status !== ProjectStatus.draft,
            hideDefaultActions: true,         
            expandable: {
                template: (project) => {
                    return <ProjectDetail project={project} enableEditing={enableEditing} />;
                }
            }
        });
    }, [projects]);

    if (loading) {
        return <div className="p-4 text-center">Loading projects...</div>;
    }

    return <Manager />;
};

export default UserProjectManager;