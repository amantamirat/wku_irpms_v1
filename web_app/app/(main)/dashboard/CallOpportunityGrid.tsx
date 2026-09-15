'use client';
import { useEffect, useState } from 'react';
import { Call, CallStatus } from '../calls/models/call.model';
import { CallCard } from './CallCard';
import { CallApi } from '../calls/api/call.api';
import { GridSkeleton } from '@/components/Skeletons';

const CallOpportunityGrid = () => {

    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCalls = async () => {
            try {
                const data = await CallApi.lookup!({ status: CallStatus.active });
                
                // Sort calls by deadline, handling undefined deadlines safely
                const sortedData = (data || []).sort((a, b) => {
                    // If deadline is missing, fallback to a far future timestamp (puts them at the end)
                    // Alternatively, use a specific date like: new Date('2099-12-31').getTime()
                    const timeA = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
                    const timeB = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
                    
                    return timeB- timeA; // Ascending: soonest deadline first
                });

                setCalls(sortedData);
            } catch (err) {
                console.error("Error loading calls:", err);
            } finally {
                setLoading(false);
            }
        };
        loadCalls();
    }, []);

    if (loading) {
        return <GridSkeleton count={4} />;
    }
    return (
        <div className="grid mt-2">
            {calls.length > 0 ? (
                calls.map((call) => (
                    <div key={call._id} className="col-12 md:col-6 xl:col-4 p-2">
                        <CallCard
                            call={call}
                            onApply={(id) => window.location.href = `/apply/${id}`}
                        />
                    </div>
                ))
            ) : (
                <div className="col-12 text-center py-5">
                    <i className="pi pi-folder-open text-4xl text-300 mb-3"></i>
                    <p className="text-500">No active calls available at the moment.</p>
                </div>
            )}
        </div>
    );
};

export default CallOpportunityGrid;