import React, { useEffect, useState } from 'react';
import StageCard from './StageCard';
import ErrorCard from '@/components/ErrorCard';
import ListSkeleton from '@/components/ListSkeleton';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';
import { CallStageApi } from '../calls/stages/api/call.stage.api';
import { CallStage } from '../calls/stages/models/call.stage.model';
import { CallStageStatus } from '../calls/stages/models/call.stage.state-machine';

const StageGrid = () => {
    const [stages, setStages] = useState<CallStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { hasPermission } = useAuth();
    const canRead = hasPermission(["call.stage:read"]);

    useEffect(() => {
        if (!canRead) return; // ✅ condition inside hook

        const fetchStages = async () => {
            try {
                const data = await CallStageApi.getAll({
                    status: CallStageStatus.active,
                    order: 1
                });
                setStages(data);
            } catch (err: any) {
                setError("Failed to fetch stages. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchStages();
    }, [canRead]); // ✅ dependency added

    if (!canRead) {
        return null; // ✅ after hooks
    }

    if (loading) return <ListSkeleton />;

    if (error) return <ErrorCard errorMessage={error} />;

    if (stages.length === 0) {
        return (
            <div className="flex justify-content-center align-items-center py-6">
                <div className="text-center">
                    <i className="pi pi-inbox text-4xl text-500 mb-3" />
                    <p className="text-500">No open calls at the moment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {stages.map((stage) => (
                <div key={stage._id} className="col-12 sm:col-6 lg:col-4 xl:col-3">
                    <StageCard stage={stage} />
                </div>
            ))}
        </div>
    );
};

export default StageGrid;