'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VerificationApi } from "../api/verification.api";
import { Verification } from "../models/verification.model";
import { VerificationConfiguration } from "../verification-conf/models/verification-conf.model";
import { BASE_URL } from "@/api/ApiClient";

interface VerificationManagerProps {
    configuration: VerificationConfiguration;
}

const VerificationManager = ({ configuration }: VerificationManagerProps) => {
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchVerifications = async () => {
            if (!configuration?._id) return;
            setLoading(true);
            try {
                const data = await VerificationApi.getByConfiguration(configuration._id);
                setVerifications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching verifications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVerifications();
    }, [configuration]);

    const handleUpdateVerification = useCallback((updated: Partial<Verification>) => {
        setVerifications((prev) =>
            prev.map((item) => {
                if (item._id && updated._id && item._id === updated._id) {
                    return { ...item, ...updated } as Verification;
                }
                return item;
            })
        );
    }, []);

    // ✅ STABLE COMPONENT DEFINITION: 'verifications' is NOT in dependency array
    const Manager = useMemo(() => {
        return createEntityManager<Verification>({
            title: "Manage Verifications",
            itemName: "Verification",
            api: VerificationApi,
            columns: [

                {
                    header: "Project",
                    field: "project",
                    sortable: true,
                    body: (r: Verification) => (
                        <span className="text-700 truncate block style={{ maxWidth: '200px' }}">
                            {typeof r.project === "object" ? (r.project as any)?.title : r.project}
                        </span>
                    )
                },
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
                },
                /*
                {
                    header: "Submitted At",
                    field: "submittedAt",
                    sortable: true,
                    body: (r: Verification) => (
                        <span className="text-600 text-sm">
                            {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "-"}
                        </span>
                    )
                },
                {
                    header: "Remarks",
                    field: "remarks",
                    body: (r: Verification) => (
                        <div className="text-600 truncate text-sm" style={{ maxWidth: '200px' }} title={r.remarks}>
                            {r.remarks || "-"}
                        </div>
                    )
                }*/
            ],
            permissionPrefix: "verification"
        });
    }, [handleUpdateVerification]);

    if (loading) {
        return <div className="p-4 text-center">Loading verifications...</div>;
    }

    return <Manager items={verifications} />;
};

export default VerificationManager;