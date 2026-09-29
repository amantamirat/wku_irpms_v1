'use client';

import { ItemDataTable } from "@/components/data-table/ItemDataTable";
import MyBadge from "@/templates/MyBadge";
import Link from "next/link";
import { Button } from "primereact/button";
import { Application } from "../../applications/models/application.model";
interface MyPendingApplicationsProps {
    items: Application[];
}
const PendingApplications = ({ items }: MyPendingApplicationsProps) => {


    const columns = [
        {
            header: "Project Title",
            field: "project.title",
            sortable: true,
            body: (app: Application) => {
                const project =
                    typeof app.project === "object" && app.project !== null
                        ? app.project
                        : null;

                const title =
                    project?.title ??
                    (typeof app.project === "string"
                        ? app.project
                        : "Unknown Project");

                return (
                    <div
                        className="truncate text-sm font-medium"
                        title={title}
                        style={{ maxWidth: "240px" }}
                    >
                        {title}
                    </div>
                );
            },
        },
        {
            header: "Stage",
            field: "stage.name",
            sortable: true,
            body: (app: Application) => {
                const stage =
                    typeof app.stage === "object" && app.stage !== null
                        ? app.stage
                        : null;

                const stageName =
                    stage?.name ??
                    (typeof app.stage === "string"
                        ? app.stage
                        : "Unknown Stage");

                return (
                    <div className="text-sm font-medium">
                        {stageName}
                    </div>
                );
            },
        },

        {
            header: "Status",
            field: "status",
            sortable: true,
            body: (app: Application) => (
                <MyBadge
                    type="status"
                    value={app.status ?? "pending"}
                />
            ),
        },

    ];



    return (
        <div className="card border-none shadow-1 p-4 mb-4">
            <div className="flex align-items-center justify-content-between mb-4">
                <div>
                    <h5 className="m-0 text-xl font-bold">
                        Pending Applications
                    </h5>

                    <p className="text-500 text-sm m-0">
                        Applications assigned to you for assign reviewers
                    </p>
                </div>

                <Link href="/dashboard/assigned-applications">
                    <Button
                        label="View All"
                        icon="pi pi-arrow-right"
                        iconPos="right"
                        className="p-button-text p-button-sm"
                    />
                </Link>
            </div>

            <ItemDataTable
                items={items}
                columns={columns}
                enableSearch={false}
            /*
            expandable={{
                template: (application) => (
                    <ApplicationDetail
                        application={application}
                    />
                ),
            }}*/
            />
        </div>
    );
};

export default PendingApplications;