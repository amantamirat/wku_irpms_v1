'use client';
import { createEntityManager } from "@/components/data-table/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { BASE_URL } from "@/api/ApiClient";
import { VerificationApi } from "@/app/(main)/verifications/api/verification.api";
import { FilterVerification, Verification } from "@/app/(main)/verifications/models/verification.model";
import { extractId } from "@/utils/utils";
import { Project } from "../../projects/models/project.model";


interface VerificationManagerProps {
    project: string | Project;
    enableEditing?: boolean;
}

const VerificationManager = ({
    project,
    enableEditing
}: VerificationManagerProps) => {
    const projectId = extractId(project);

    const Manager = createEntityManager<Verification, FilterVerification>({
        itemName: "Verification",
        api: VerificationApi,
        useLookup: true,
        query: () => ({ project }),
        columns: [
            {
                header: "Attempt",
                field: "attempt",
                sortable: true,
                body: (r: Verification) => (
                    <span className="font-semibold text-700">#{r.attempt}</span>
                )
            },
            {
                header: "Score",
                body: (app: Verification) => (
                    <span className="font-bold text-sm">
                        {typeof app?.totalScore === "number" ? app.totalScore : "—"}
                    </span>
                )
            },
            {
                header: "Status",
                field: "status",
                sortable: true,
                body: (r: Verification) => (
                    <MyBadge type="status" value={r.status ?? "submitted"} />
                )
            },
            {
                header: "Document",
                body: (r: Verification) => r.documentPath ? (
                    <a
                        href={`${BASE_URL}/${r.documentPath.replace(/^\\/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium text-sm"
                    >
                        <i className="pi pi-file-pdf text-red-500"></i> View PDF
                    </a>
                ) : (
                    <span className="text-gray-400 italic">
                        No document
                    </span>
                )
            }
        ],
        permissionPrefix: "verification",
        hideSearch: true,
        hideEditAction: true,
        hideDeleteAction: !enableEditing
    });

    return <Manager key={projectId} />;
};

export default VerificationManager;