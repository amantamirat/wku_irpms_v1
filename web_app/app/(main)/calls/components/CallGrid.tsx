
import React, { useEffect, useRef, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Call, CallStatus } from '../models/call.model';
import { CallApi } from '../api/call.api';
import { Skeleton } from 'primereact/skeleton';
import CallCard from './CallCard';


export default function CallGrid() {

    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                setLoading(true);
                const data = await CallApi.getCalls({status:CallStatus.active});
                setCalls(data);
            } catch (err) {
                console.error('Failed to fetch calls of directorates', err);
                setError('Failed to load calls. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchCalls();
    }, []);


    if (loading) {
        return (
            <div className="grid">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="col-12 lg:col-6 xl:col-3">
                        <Card className="mb-3">
                            <Skeleton width="100%" height="150px" className="mb-2" />
                            <Skeleton width="80%" height="1.5rem" className="mb-2" />
                            <Skeleton width="60%" height="1rem" className="mb-2" />
                            <Skeleton width="90%" height="4rem" />
                        </Card>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex align-items-center justify-content-center py-6">
                <div className="text-center">
                    <i className="pi pi-exclamation-triangle text-4xl text-500 mb-3" />
                    <p className="text-500 mb-4">{error}</p>
                    <Button
                        label="Retry"
                        icon="pi pi-refresh"
                        onClick={() => window.location.reload()}
                    />
                </div>
            </div>
        );
    }

    if (calls.length === 0) {
        return (
            <div className="flex align-items-center justify-content-center py-6">
                <div className="text-center">
                    <i className="pi pi-inbox text-4xl text-500 mb-3" />
                    <p className="text-500">No calls available at the moment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid">
            {calls.map((call) =>
            (
                <div key={call._id} className="col-12 lg:col-6 xl:col-3">
                    <CallCard call={call} />
                </div>
            )
            )}
        </div>

    )
}
