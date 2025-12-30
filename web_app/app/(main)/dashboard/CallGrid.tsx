import React, { useEffect, useState } from 'react';
import CallCard from './CallCard';
import ErrorCard from '@/components/ErrorCard';
import { Call, CallStatus } from '../calls/models/call.model';
import { CallApi } from '../calls/api/call.api';
import ListSkeleton from '@/components/ListSkeleton';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';

const CallGrid = () => {
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { hasPermission } = useAuth();
    const canRead = hasPermission([PERMISSIONS.CALL.READ]);
    if (!canRead) {
        return (<></>);
    }

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                setLoading(true);
                const data = await CallApi.getCalls({ status: CallStatus.active });
                setCalls(data);
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
            <ListSkeleton />
        );
    }

    if (error) return <ErrorCard errorMessage={error} />;

    if (calls.length === 0)
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
            {calls.map((call) => (
                <div key={call._id} className="col-12 sm:col-6 lg:col-4 xl:col-3">
                    <CallCard call={call} />
                </div>
            ))}
        </div>
    );
}

export default CallGrid;
