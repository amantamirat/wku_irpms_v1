'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VerificationApi } from "../api/verification.api";
import { Verification } from "../models/verification.model";
import { VerificationConfiguration } from "../verification-conf/models/verification-conf.model";

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
                    header: "Attempt",
                    field: "attempt",
                    sortable: true,
                    body: (r: Verification) => (
                        <span className="font-semibold text-700">#{r.attempt}</span>
                    )
                },
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
                    header: "Status",
                    field: "status",
                    sortable: true,
                    body: (r: Verification) => (
                        <MyBadge type="status" value={r.status ?? "submitted"} />
                    )
                },
                {
                    header: "Document",
                    field: "documentPath",
                    body: (r: Verification) => (
                        r.documentPath ? (
                            <a
                                href={r.documentPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm font-medium"
                            >
                                View Document
                            </a>
                        ) : (
                            <span className="text-400 text-sm">No Document</span>
                        )
                    )
                },
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
                }
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