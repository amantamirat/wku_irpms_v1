'use client';

import { useEffect, useState } from 'react';
import { GridSkeleton } from '@/components/Skeletons';
import { CallApi } from '../../calls/api/call.api';
import { CallOpportunityDTO } from '../../calls/models/call.model';
import { CallOpportunityCard } from './CallOpportunityCard';

const CallOpportunityGrid = () => {
    const [opportunities, setOpportunities] = useState<CallOpportunityDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOpportunities = async () => {
            try {
                const data = await CallApi.getOpportunities();

                const sorted = [...(data ?? [])].sort((a, b) => {
                    const dateA = a.activeStage.deadline
                        ? new Date(a.activeStage.deadline).getTime()
                        : Number.MAX_SAFE_INTEGER;

                    const dateB = b.activeStage.deadline
                        ? new Date(b.activeStage.deadline).getTime()
                        : Number.MAX_SAFE_INTEGER;

                    return dateA - dateB;
                });

                setOpportunities(sorted);
            } catch (error) {
                console.error('Failed to load opportunities:', error);
            } finally {
                setLoading(false);
            }
        };

        loadOpportunities();
    }, []);

    if (loading) {
        return <GridSkeleton count={4} />;
    }

    if (!opportunities.length) {
        return (
            <div className="text-center py-6 surface-card border-round shadow-sm p-4">
                <i className="pi pi-folder-open text-4xl text-300 mb-3" />
                <p className="text-500 m-0">
                    No opportunities available at the moment.
                </p>
            </div>
        );
    }

    return (
        <div className="grid formgrid align-items-start">
            {opportunities.map((opportunity) => (
                <div
                    key={opportunity.call._id}
                    className="col-12 md:col-6 xl:col-4 p-2"
                >
                    <CallOpportunityCard opportunity={opportunity} />
                </div>
            ))}
        </div>
    );
};

export default CallOpportunityGrid;