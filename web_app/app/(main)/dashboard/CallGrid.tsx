import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Skeleton } from 'primereact/skeleton';
import CallCard from './CallCard';
import ErrorCard from '@/components/ErrorCard';
import { Call, CallStatus } from '../calls/models/call.model';
import { CallApi } from '../calls/api/call.api';

const CallGrid = () => {
    const [cycles, setCycles] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                setLoading(true);
                const data = await CallApi.getCalls({ type: "Call", status: CallStatus.active });
                setCycles(data);
            } catch {
                setError('Failed to load calls. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchCalls();
    }, []);

    if (loading) {
        return (
            <div className="grid gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="col-12 sm:col-6 lg:col-4 xl:col-3">
                        <Card className="h-full">
                            <Skeleton width="100%" height="160px" className="mb-3" />
                            <Skeleton width="80%" height="1.5rem" className="mb-2" />
                            <Skeleton width="60%" height="1rem" className="mb-2" />
                            <Skeleton width="90%" height="3rem" />
                        </Card>
                    </div>
                ))}
            </div>
        );
    }

    if (error) return <ErrorCard errorMessage={error} />;

    if (cycles.length === 0)
        return (
            <div className="flex justify-content-center align-items-center py-6">
                <div className="text-center">
                    <i className="pi pi-inbox text-4xl text-500 mb-3" />
                    <p className="text-500">No active calls at the moment.</p>
                </div>
            </div>
        );

    return (
        <div className="grid gap-4">
            {cycles.map((call) => (
                <div key={call._id} className="col-12 sm:col-6 lg:col-4 xl:col-3">
                    <CallCard call={call} />
                </div>
            ))}
        </div>
    );
}

export default CallGrid;
