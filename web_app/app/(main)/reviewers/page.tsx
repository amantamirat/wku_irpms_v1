'use client';
import { ItemDataTable } from "@/components/data-table/ItemDataTable";
import MyBadge from "@/templates/MyBadge";
import { extractId } from "@/utils/utils";
import { useEffect, useState } from "react";
import ProjectDetail from "../projects/components/ProjectDetail";
import { ReviewerApi } from "./api/reviewer.api";
import { Reviewer } from "./models/reviewer.model";

const ReviewersManager = () => {
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchReviewers = async () => {
            setLoading(true);

            try {
                const data = await ReviewerApi.getAll();
                setReviewers(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching reviewers", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviewers();
    }, []);

    const columns = [
        {
            header: "Project Title",
            field: "project.title",
            body: (collaborator: Reviewer) => {
                const project =
                    typeof collaborator.project === "object"
                        ? collaborator.project
                        : null;

                const title = project?.title ?? "Unknown Project";

                return (
                    <div
                        className="truncate text-sm font-medium"
                        title={title}
                        style={{ maxWidth: "350px" }}
                    >
                        {title}
                    </div>
                );
            }
        },
        {
            header: "Evaluator",
            field: "user.name",
            sortable: true,
            body: (collaborator: Reviewer) => {
                const user =
                    typeof collaborator.reviewer === "object"
                        ? collaborator.reviewer
                        : null;

                return (
                    <div>
                        {(user as any)?.name ?? "N/A"}
                    </div>
                );
            }
        },

        {
            header: "Lead",
            field: "project.leadPI.name",
            sortable: true,
            body: (collaborator: Reviewer) => {
                const project =
                    typeof collaborator.project === "object"
                        ? collaborator.project
                        : null;

                return (
                    <div>
                        {(project?.leadPI as any)?.name ?? "N/A"}
                    </div>
                );
            }
        },
        {
            header: "Status",
            field: "status",
            sortable: true,
            body: (collaborator: Reviewer) => (
                <MyBadge
                    type="status"
                    value={collaborator.status ?? "Unknown"}
                />
            )
        }
    ];

    if (loading) {
        return (
            <div className="p-4 text-center">
                Loading collaborators...
            </div>
        );
    }



    return (
        <div className="card border-none shadow-1 p-4 mb-4">
            <div className="mb-4">
                <h5 className="m-0 text-xl font-bold">
                    Evaluators
                </h5>

                <p className="text-500 text-sm m-0">
                    View and manage all project reviewers
                </p>
            </div>

            <ItemDataTable
                items={reviewers}
                columns={columns}
                enableSearch={true}
                expandable={{
                    template: (collaborator) => {
                        const projectId =
                            extractId(collaborator.project);

                        if (!projectId) {
                            return (
                                <div className="p-3 text-500">
                                    No project ID found.
                                </div>
                            );
                        }

                        return (
                            <ProjectDetail project={projectId} />
                        );
                    }
                }}
            />
        </div>
    );
};

export default ReviewersManager;