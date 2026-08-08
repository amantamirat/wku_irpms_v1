'use client';

import { BASE_URL } from "@/api/ApiClient";
import { createEntityManager } from "@/components/createEntityManager";
import { useEffect, useMemo, useState } from "react";
import { Stage } from "../../calls/stages/models/stage.model";
import ReviewerManager from "../../reviewers/application/Manager";
import { ApplicationApi } from "../api/application.api";
import { Application } from "../models/application.model";
import { Project } from "../../projects/models/project.model";
import MyBadge from "@/templates/MyBadge";

interface ApplicationManagerProps {
    project: Project;
}

const ApplicationManager = ({ project }: ApplicationManagerProps) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchApplications = async () => {
            if (!project) return;
            setLoading(true);
            try {
                const data = await ApplicationApi.getAll({ project: project }, true);
                setApplications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching applications for stage:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [project]);

    // useMemo prevents component re-creation on every render cycle
    const Manager = useMemo(() => {
        return createEntityManager<Application>({
            //title: "Applications",
            itemName: "Application",
            api: ApplicationApi,
            columns: [
                {
                    header: "Stage", field: "stage.name",
                    body: (ps: Application) => {
                        const stageName = typeof ps.stage === "object" ? ps.stage?.name : "Unkown Stage"
                        return <div className="capitalize">{stageName}</div>;
                    },
                    sortable: true
                },
                {
                    header: "Document",
                    body: (ps: Application) => ps.documentPath ? (
                        <a href={`${BASE_URL}/${ps.documentPath.replace(/^\\/, "")}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                            <i className="pi pi-file-pdf mr-1 text-red-500"></i> View PDF
                        </a>
                    ) : <span className="text-gray-400 italic">No document</span>
                },
                {
                    header: "Score",
                    body: (ps: Application) => <span className="font-bold text-lg">{typeof ps?.totalScore === "number" ? ps.totalScore : "—"}</span>
                },
                {
                    header: "Status",
                    body: (app: Application) => <MyBadge type="status" value={app.status} />
                },

            ],
            items: applications,
            permissionPrefix: "application",
            hideSearch:true,
            hideDefaultActions: true,
            /*
            expandable: {
                template: (ps) => <ReviewerManager application={ps} />
            },*/
        });
    }, [applications]);

    if (loading) {
        return <div className="p-4 text-center">Loading applications...</div>;
    }

    return <Manager />;
};

export default ApplicationManager;