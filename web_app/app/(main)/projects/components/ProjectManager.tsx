'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { useAuth } from "@/contexts/auth-context";
import MyBadge from "@/templates/MyBadge";
import { useMemo } from "react";
import { Calendar } from "../../calendars/models/calendar.model";
import { Call } from "../../calls/models/call.model";
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";
import { User } from "../../users/models/user.model";
import { ProjectApi } from "../api/project.api";
import { GetProjectsOptions, Project, ProjectStatus } from "../models/project.model";
import { PROJECT_STATUS_ORDER, PROJECT_TRANSITIONS } from "../models/project.state-machine";
import ProjectDetail from "./ProjectDetail";
import ProjectWizard from "./ProjectWizard";

interface ProjectManagerProps {
    grant?: Grant;
    calendar?: Calendar;
    applicant?: User;
    call?: Call;
    workspace?: Organization;
    onItemsChange?: (items: Project[]) => void;
}

const ProjectManager = ({ applicant, grant, calendar, call, workspace, onItemsChange }: ProjectManagerProps) => {
    const { getUser } = useAuth();
    const activeUser = getUser();

    // Pure primitive strings extracted out of components to keep checks bulletproof
    const grantId = typeof grant === 'object' ? (grant as any)?._id : grant;
    const calendarId = typeof calendar === 'object' ? (calendar as any)?._id : calendar;
    const workspaceId = workspace?._id;
    const applicantId = applicant?._id;

    const columns = useMemo(() => {
        const cols: any[] = [
            { header: "Grant Source", field: "grant.title", sortable: true },
            {
                header: "Title",
                field: "title",
                sortable: true,
                body: (row: Project) => (
                    <div className="text-700 truncate text-sm" style={{ maxWidth: '250px' }} title={row.title}>
                        {row.title}
                    </div>
                )
            }
        ];

        if (!applicant) {
            cols.push({
                header: "Applicant",
                field: "applicant.name",
                sortable: true,
                body: (p: Project) => (
                    <span className="text-600">
                        {typeof p.applicant === "object" ? p.applicant?.name : p.applicant}
                    </span>
                )
            });
        }

        cols.push({
            field: "status",
            header: "Status",
            sortable: true,
            body: (p: Project) => <MyBadge type="status" value={p.status ?? "Draft"} />
        });

        return cols;
    }, [applicant]);

    // Construct the manager cleanly
    const Manager = useMemo(() => {
        return createEntityManager<Project, GetProjectsOptions | undefined>({
            title: "Manage Projects",
            itemName: "Project",
            api: ProjectApi,
            onItemsChange: onItemsChange,
            columns: columns,
            createNew: () => ({
                grant: grant ?? undefined,
                applicant: activeUser ?? undefined,
                workspace: workspace ?? undefined,
                title: "",
                summary: "",
                themes: []
            }),
            SaveDialog: ProjectWizard,
            permissionPrefix: "project",
            query: () => ({
                call,
                populate: true,
                workspace: workspaceId,
                applicant: applicantId,
                calendar: calendarId,
                grant: grantId,
            }),
            workflow: {
                statusField: "status",
                transitions: PROJECT_TRANSITIONS,
                statusOrder: PROJECT_STATUS_ORDER
            },
            //hideDefaultActions: !applicant,
            disableDeleteRow: (row) => row.status !== ProjectStatus.draft,
            expandable: {
                template: (project, actions) => (
                    <ProjectDetail
                        project={project}
                        updateProject={(updated) => actions.updateItem(updated)}
                    />
                )
            }
        });
    }, [call, grantId, calendarId, workspaceId, applicantId, columns, onItemsChange]);

    return <Manager />;
};

export default ProjectManager;