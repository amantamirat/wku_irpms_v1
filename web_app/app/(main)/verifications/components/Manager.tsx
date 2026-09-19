'use client';
import { BASE_URL } from '@/api/ApiClient';
import { StateTransition } from '@/api/EntityApi';
import {
    ItemDataTable,
    RowActionButton
} from '@/components/data-table/ItemDataTable';
import { useStateTransitionActions } from '@/hooks/useStateTransitionActions';
import MyBadge from '@/templates/MyBadge';
import { extractId } from '@/utils/utils';
import { useEffect, useState } from 'react';
import { VerificationApi } from '../api/verification.api';
import { Verification } from '../models/verification.model';
import { VERIFICATION_TRANSITIONS } from '../models/verification.state-machine';
import { VerificationConfiguration } from '../verification-conf/models/verification-conf.model';
import VrificationDetail from './VerificationDetail';

interface VerificationManagerProps {
    configuration: VerificationConfiguration;
}

const VerificationManager = ({ configuration }: VerificationManagerProps) => {
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchVerifications = async () => {
            const confId = extractId(configuration);
            if (!confId) return;
            setLoading(true);
            try {
                const data = await VerificationApi.getAll({ configuration: confId });
                setVerifications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching verifications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVerifications();
    }, [configuration]);

    const handleTransition = async (
        id: string,
        transition: StateTransition
    ) => {
        const updated = await VerificationApi.transitionState?.(
            id,
            transition
        );

        if (!updated) return;

        setVerifications(prev =>
            prev.map(item =>
                item._id === id
                    ? {
                        ...item,
                        status: updated.status,
                        //totalScore: updated.totalScore ?? item.totalScore
                    }
                    : item
            )
        );
    };

    const stateActions: RowActionButton<Verification>[] =
        useStateTransitionActions({
            resource: 'verification',
            statusField: 'status',
            transitions: VERIFICATION_TRANSITIONS,
            onTransition: handleTransition
        });

    const columns = [
        {
            header: "Project",
            field: "project",
            sortable: true,
            body: (r: Verification) => {
                const projectTitle = typeof r.project === "object" ? (r.project as any)?.title : r.project;
                return (
                    <div
                        className="text-700 truncate text-sm"
                        style={{ maxWidth: "250px" }}
                        title={projectTitle}
                    >
                        {projectTitle}
                    </div>
                );
            }
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
            header: "Score",
            field: "totalScore",
            sortable: true,
            body: (r: Verification) => (
                <span className="font-bold text-sm">
                    {typeof r?.totalScore === "number" ? r.totalScore : "—"}
                </span>
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
        {
            header: "Status",
            field: "status",
            sortable: true,
            body: (r: Verification) => (
                <MyBadge type="status" value={r.status ?? "submitted"} />
            )
        }
    ];

    if (loading) {
        return <div className="p-4 text-center">Loading verifications...</div>;
    }

    return (
        <ItemDataTable
            items={verifications}
            columns={columns}
            rowActions={stateActions}
            enableSearch
            expandable={{
                template: (v) => <VrificationDetail verification={v} />
            }}
        />
    );
};

export default VerificationManager;