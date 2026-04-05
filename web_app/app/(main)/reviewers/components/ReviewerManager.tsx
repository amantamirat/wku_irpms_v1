'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { ReviewerApi } from "../api/reviewer.api";
import { GetReviewersOptions, Reviewer, ReviewerStatus } from "../models/reviewer.model";
import SaveReviewerDialog from "./SaveReviewerDialog";
import MyBadge from "@/templates/MyBadge";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { ProjectStage } from "../../projects/stages/models/project.stage.model";

interface ReviewerManagerProps {
    projectStage?: ProjectStage;
    applicant?: Applicant;
}

const ReviewerManager = ({ projectStage, applicant }: ReviewerManagerProps) => {

    const columns: any[] = [];

    // Column: Stage & Project (when filtering by applicant)
    if (applicant) {
        columns.push({
            header: "Stage",
            field: "projectStage.stage.name",
            sortable: true,
            body: (r: Reviewer) =>
                (r.projectStage as any)?.stage?.name || "-"
        });

        columns.push({
            header: "Project",
            field: "projectStage.project.title",
            sortable: true,
            body: (r: Reviewer) =>
                (r.projectStage as any)?.project?.title || "-"
        });
    }

    // Column: Reviewer (when filtering by projectStage)
    if (projectStage) {
        columns.push({
            header: "Reviewer",
            field: "applicant.name",
            body: (r: Reviewer) =>
                (r.applicant as any)?.name || "Unknown"
        });
    }

    // Common Columns
    columns.push(
        {
            header: "Score",
            field: "score",
            body: (row: Reviewer) =>
                [ReviewerStatus.submitted, ReviewerStatus.approved].includes(row.status)
                    ? row.score ?? "-"
                    : "-"
        },
        {
            header: "Status",
            field: "status",
            sortable: true,
            body: (r: Reviewer) => (
                <MyBadge type="status" value={r.status ?? "Unknown"} />
            )
        }
    );

    const Manager = createEntityManager<Reviewer, GetReviewersOptions>({
        title: "Reviewers",
        itemName: "Reviewer",
        api: ReviewerApi,
        columns,
        createNew: 
            projectStage?(): Reviewer => ({
                projectStage: projectStage,
                applicant: applicant ?? undefined,
                weight: 1,
                status: ReviewerStatus.pending
            }):undefined,

        SaveDialog: projectStage ? SaveReviewerDialog : undefined,
        permissionPrefix: "reviewer",

        query: () => ({
            applicant: applicant?._id,
            projectStage: projectStage?._id,
            populate: true
        }),

        // Only allow delete if still pending
        disableDeleteRow: (row: Reviewer) =>
            row.status !== ReviewerStatus.pending,
    });

    return <Manager />;
};

export default ReviewerManager;