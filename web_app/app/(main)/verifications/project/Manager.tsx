'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useMemo, useState } from "react";
import { VerificationApi } from "../api/verification.api";
import { Verification } from "../models/verification.model";
import { BASE_URL } from "@/api/ApiClient";
import { Project } from "../../projects/models/project.model";
import { extractId } from "@/utils/extractId";

interface VerificationManagerProps {
    project: string | Project;
}

const VerificationManager = ({ project }: VerificationManagerProps) => {
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const projectId = extractId(project);

    useEffect(() => {
        const fetchVerifications = async () => {
            if (!projectId) return;
            setLoading(true);
            try {
                const data = await VerificationApi.getAll({ project: projectId });
                setVerifications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching verifications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVerifications();
    }, [projectId]);

    const Manager = useMemo(() => {
        return createEntityManager<Verification>({
            //title: "Manage Verifications",
            itemName: "Verification",
            api: VerificationApi,
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
            hideDefaultActions: true
        });
    }, []);

    if (loading) {
        return <div className="p-4 text-center">Loading verifications...</div>;
    }

    return <Manager items={verifications} />;
};

export default VerificationManager;