
import React, { useEffect, useRef, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Call } from '../models/call.model';
import { CallApi } from '../api/call.api';
import { Calendar } from '../../calendars/models/calendar.model';
import { Organization } from '@/models/organization';
import { Skeleton } from 'primereact/skeleton';
import { Badge } from 'primereact/badge';


export default function CallGrid() {

    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                setLoading(true);
                const data = await CallApi.getCalls({});
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

    const getDeadlineStatus = (deadline: Date): { severity: SeverityType; text: string } => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { severity: "danger", text: "Expired" };
        if (diffDays <= 7) return { severity: "warning", text: "Soon" };
        return { severity: "success", text: "Active" };
    };


    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="grid">
            {calls.map((call) => {
                const deadlineStatus = getDeadlineStatus(call.deadline);

                const header = <img alt="Call" src={call.poster || "/images/callcard.png"} />;

                const footer = (
                    <div className="flex justify-content-between align-items-center">
                        <div className="flex gap-2">
                            <Button label="View" icon="pi pi-eye" severity="info"
                                rounded raised outlined
                            />
                            <Button
                                label="Apply" icon="pi pi-check-circle" severity="success"
                                rounded raised outlined
                                disabled={deadlineStatus.severity === 'danger'}
                            />
                        </div>
                    </div>
                );

                return (

                    <div key={call._id} className="col-12 lg:col-6 xl:col-3">
                        <Card
                            title={call.title}
                            subTitle={
                                <div className="flex flex-column gap-1">
                                    <span>{(call.directorate as Organization).name}</span>
                                    <span>{(call.calendar as Calendar).year}</span>
                                    <span>
                                        <strong>
                                            <span style={{ color: "red" }}>Deadline:</span>{" "}
                                            {new Date(call.deadline).toLocaleDateString()}
                                        </strong>
                                    </span>
                                </div>
                            }
                            header={header}
                            footer={footer}
                            className="mb-3 h-full hover:shadow-lg transition-shadow duration-300"
                        >
                            <p className="m-0">
                                {truncateText(call.description || "", 100)}
                            </p>
                        </Card>
                    </div>
                );
            })}
        </div>

    )
}
