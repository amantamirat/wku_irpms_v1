'use client';

import { useEffect, useState } from 'react';
import { GridSkeleton } from '@/components/Skeletons';
import { Call, CallStatus } from '../calls/models/call.model';
import { CallApi } from '../calls/api/call.api';
import { CallCard } from './CallCard';

const CallOpportunityGrid = () => {
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCalls = async () => {
            try {
                const data = await CallApi.lookup!({
                    status: CallStatus.active,
                });

                const sorted = (data ?? []).sort((a, b) => {
                    const dateA = a.deadline
                        ? new Date(a.deadline).getTime()
                        : Number.MAX_SAFE_INTEGER;

                    const dateB = b.deadline
                        ? new Date(b.deadline).getTime()
                        : Number.MAX_SAFE_INTEGER;

                    return dateA - dateB;
                });

                setCalls(sorted);
            } catch (error) {
                console.error('Failed to load calls:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCalls();
    }, []);

    if (loading) {
        return <GridSkeleton count={4} />;
    }

    if (!calls.length) {
        return (
            <div className="text-center py-6">
                <i className="pi pi-folder-open text-4xl text-300 mb-3" />
                <p className="text-500 m-0">
                    No active calls available at the moment.
                </p>
            </div>
        );
    }

    return (
        <div className="grid mt-2">
            {calls.map((call) => (
                <div
                    key={call._id}
                    className="col-12 md:col-6 xl:col-4 p-2"
                >
                    <CallCard call={call} />
                </div>
            ))}
        </div>
    );
};

export default CallOpportunityGrid;
