'use client';

import { BASE_URL } from "@/api/ApiClient";
import { CallStage } from "@/app/(main)/calls/stages/models/call.stage.model";
import { GrantStage } from "@/app/(main)/grants/stages/models/grant.stage.model";
import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useState } from "react";
import { Project } from "../../models/project.model";
import { ProjectStageApi } from "../api/project.stage.api";
import { GetProjectStageOptions, ProjectStage, ProjectStageStatus, createEmptyProjectStage } from "../models/project.stage.model";
import { PROJECT_STAGE_STATUS_ORDER, PROJECT_STAGE_TRANSITIONS } from "../models/project.stage.state-machine";
import ProjectStageDetail from "./ProjectStageDetail";
import SaveProjectStage from "./SaveProjectStage";
import { GrantAllocation } from "@/app/(main)/grants/allocations/models/grant.allocation.model";

interface ProjectStageManagerProps {
    project?: string | Project;
    grantStage?: string | GrantStage;
    grantAllocation?: string | GrantAllocation;
    callStage?: string | CallStage;
}

const ProjectStageManager = ({ project, grantStage, grantAllocation, callStage }: ProjectStageManagerProps) => {

    /*
    const [selectedStage, setSelectedStage] = useState<ProjectStage | null>(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);

    const openReviewers = (ps: ProjectStage) => {
        setSelectedStage(ps);
        setSidebarVisible(true);
    };
    */

    // --- Dynamic Column Logic ---
    const columns = [];

    // 1. Only show "Project" if we aren't already filtered by a specific project
    if (!project) {
        if (!project) {
            columns.push({
                header: "Project",
                field: "project.title",
                sortable: true,
                style: { width: '25%' }, // Give it a fixed relative width
                body: (ps: ProjectStage) => {
                    const title = typeof ps.project === "object" ? ps.project.title : "Unknown Project";
                    return (
                        <span
                            className="block white-space-nowrap overflow-hidden text-overflow-ellipsis"
                            title={title} // Standard HTML tooltip
                            style={{ maxWidth: '250px' }} // Adjust based on your layout
                        >
                            {title}
                        </span>
                    );
                }
            });
        }
    }

    // 2. Only show "Stage Name" if we aren't already inside a specific stage tab
    if (!grantStage && !callStage) {
        columns.push({
            header: "Stage",
            field: "grantStage",
            body: (ps: ProjectStage) =>
                typeof ps.grantStage === "object"
                    ? (ps.grantStage as GrantStage)?.name
                    : "Loading..."
        });
    }

    // 3. Always show these columns
    columns.push(
        {
            header: "Document",
            body: (ps: ProjectStage) => ps.documentPath ? (
                <a
                    href={`${BASE_URL}/${ps.documentPath.replace(/^\\/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                >
                    <i className="pi pi-file-pdf mr-1"></i> View
                </a>
            ) : <span className="text-gray-400">No File</span>
        },
        {
            header: "Score",
            field: "totalScore",
            sortable: true,
            body: (ps: ProjectStage) => typeof ps?.totalScore === "number" ? ps.totalScore : "N/A"
        },
        /*
        {
            header: "Review Progress",
            body: (ps: ProjectStage) => (
                <div className="flex align-items-center gap-2">
                    <span className="text-sm text-secondary">3/5</span>
                    <div className="surface-200 border-round overflow-hidden w-4rem h-full" style={{ height: '8px' }}>
                        <div className="bg-primary h-full" style={{ width: '60%' }}></div>
                    </div>
                    <Button
                        icon="pi pi-users"
                        text
                        rounded
                        tooltip="Manage Reviewers"
                        onClick={() => openReviewers(ps)}
                    />
                </div>
            )
        },
        */
        {
            header: "Status",
            field: "status",
            sortable: true,
            body: (ps: ProjectStage) => <MyBadge type="status" value={ps.status ?? ProjectStageStatus.submitted} />
        }
    );

    const Manager = createEntityManager<ProjectStage, GetProjectStageOptions | undefined>({
        title: "Project Submissions",
        itemName: "Project Stage",
        api: ProjectStageApi,
        columns: columns, // Pass the dynamic array here
        createNew: project ? () => createEmptyProjectStage({ project }) : undefined,
        SaveDialog: project ? SaveProjectStage : undefined,
        permissionPrefix: "project.stage",
        query: () => ({
            project: typeof project === "object" ? project._id : project,
            grantStage: typeof grantStage === "object" ? grantStage._id : grantStage,
            grantAllocation: typeof grantAllocation === "object" ? grantAllocation._id : grantAllocation,
            populate: true
        }),
        workflow: {
            statusField: "status",
            statusOrder: PROJECT_STAGE_STATUS_ORDER,
            transitions: PROJECT_STAGE_TRANSITIONS
        },
        expandable: grantStage ? {
            template: (ps) => (
                <ProjectStageDetail projectStage={ps} />
            )
        } : undefined,
        hideEditAction: true,
        disableDeleteRow: (ps: ProjectStage) => ps.status !== ProjectStageStatus.submitted
    });

    return (
        <>
            <Manager />
            {
                /** 
                 * <Sidebar
                            visible={sidebarVisible}
                            position="right"
                            onHide={() => setSidebarVisible(false)}
                            style={{ width: '50vw' }}
                            header={
                                <div>
                                    <h3 className="m-0">Reviewers Management</h3>
                                    <small className="text-secondary">
                                        {typeof selectedStage?.project === 'object' ? selectedStage.project.title : 'Project Details'}
                                    </small>
                                </div>
                            }
                        >
                            {(selectedStage && sidebarVisible) && (
                                <div className="mt-4">
                                    <ReviewerManager projectStage={selectedStage} />
                                </div>
                            )}
                        </Sidebar>
                */
            }

        </>
    );
};

export default ProjectStageManager;