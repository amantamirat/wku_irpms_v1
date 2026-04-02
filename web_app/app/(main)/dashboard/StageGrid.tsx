'use client';
import React, { useEffect, useState, useCallback } from 'react';
import StageCard from './StageCard';
import ErrorCard from '@/components/ErrorCard';
import ListSkeleton from '@/components/ListSkeleton';
import { useAuth } from '@/contexts/auth-context';
import { CallStageApi } from '../calls/stages/api/call.stage.api';
import { CallStage } from '../calls/stages/models/call.stage.model';
import { CallStageStatus } from '../calls/stages/models/call.stage.state-machine';

const StageGrid = () => {
    const [stages, setStages] = useState<CallStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { hasPermission } = useAuth();
    const canRead = hasPermission(["call.stage:read"]);

    const fetchStages = useCallback(async () => {
        try {
            setLoading(true);
            const data = await CallStageApi.getAll({
                status: CallStageStatus.active,
                order: 1,
                populate: true
            });
            setStages(data);
        } catch (err: any) {
            setError(err.message ?? "Failed to fetch stages.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (canRead) fetchStages();
    }, [canRead, fetchStages]);

    if (!canRead) return null;
    if (loading) return <ListSkeleton />;
    if (error) return <ErrorCard errorMessage={error} />;

    if (stages.length === 0) {
        return (
            <div className="flex flex-column align-items-center py-8 surface-50 border-round-lg border-1 border-200">
                <i className="pi pi-calendar-plus text-4xl text-400 mb-3" />
                <p className="text-600 font-medium m-0">No active research calls available at this time.</p>
            </div>
        );
    }

    return (
        /* Use a standard PrimeFlex grid. 
           In an 8/12 column, md:col-6 will give you 2 cards per row. */
        <div className="grid -mt-3 -ml-3 -mr-3">
            {stages.map((stage) => (
                <div key={stage._id} className="col-12 md:col-6 xl:col-4 p-3">
                    <StageCard stage={stage} />
                </div>
            ))}
        </div>
    );
};

export default StageGrid;