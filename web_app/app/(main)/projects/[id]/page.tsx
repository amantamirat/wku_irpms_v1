'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Project } from "../models/project.model";
import { ProjectApi } from "../api/project.api";
import ProjectDetail from "../components/ProjectDetail";


export default function Page() {
    const params = useParams();
    const id = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const data = await ProjectApi.getById!(id);
                setProject(data);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProject();
    }, [id]);

    if (loading) return <p>Loading...</p>;
    if (!project) return <p>Project not found</p>;

    return (
        <div className="p-4">
            <ProjectDetail project={project} />
        </div>
    );
}
