'use client';

import { BASE_URL } from "@/api/ApiClient";
import { createEntityManager } from "@/components/createEntityManager";
import { useEffect, useMemo, useState } from "react";
import { Stage } from "../../calls/stages/models/stage.model";
import ReviewerManager from "../../reviewers/application/Manager";
import { ApplicationApi } from "../api/application.api";
import { Application } from "../models/application.model";
import { APPLICATION_STATUS_ORDER, APPLICATION_TRANSITIONS } from "../models/application.state-machine";
import MyBadge from "@/templates/MyBadge";

interface ApplicationManagerProps {
    stage: Stage;
}

const ApplicationManager = ({ stage }: ApplicationManagerProps) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchApplications = async () => {
            if (!stage) return;
            setLoading(true);
            try {
                const data = await ApplicationApi.getAll({ stage }, true);
                setApplications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching applications for stage:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [stage]);

    // useMemo prevents component re-creation on every render cycle
    const Manager = useMemo(() => {
        return createEntityManager<Application>({
            title: "Applications",
            itemName: "Application",
            api: ApplicationApi,
            columns: [
                {
                    header: "Project", field: "project.title",
                    body: (ps: Application) => {
                        const title = typeof ps.project === "object" ? ps.project.title : "Unknown Project";
                        return <div className="truncate text-sm font-medium" title={title}>{title}</div>;
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
                    header: "Status",
                    body: (app: Application) => <MyBadge type="status" value={app.status} />
                },
            ],
            items: applications,
            permissionPrefix: "application",
            workflow: {
                statusField: "status",
                statusOrder: APPLICATION_STATUS_ORDER,
                transitions: APPLICATION_TRANSITIONS
            },
            hideDefaultActions: true,
            expandable: {
                template: (ps) => <ReviewerManager application={ps} />
            },
        });
    }, [applications]);

    if (loading) {
        return <div className="p-4 text-center">Loading applications...</div>;
    }

    return <Manager />;
};

export default ApplicationManager;