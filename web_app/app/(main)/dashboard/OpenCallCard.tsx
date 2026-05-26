'use client';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Date Utilities
import { format, differenceInCalendarDays, isPast } from 'date-fns';

// Types & APIs
import { Call } from '../calls/models/call.model';
import { CallStageApi } from '../calls/stages/api/call.stage.api';
import { CallStage } from '../calls/stages/models/call.stage.model';
import { GrantAllocation } from '../grants/allocations/models/grant.allocation.model';
import { Grant } from '../grants/models/grant.model';
import { Calendar } from '../calendars/models/calendar.model';
import { Organization } from '../organizations/models/organization.model';

interface CallCardProps {
    call: Call;
    onApply?: (callId: string) => void;
}

export const OpenCallCard = ({ call }: CallCardProps) => {
    const [firstStage, setFirstStage] = useState<CallStage>();
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchFirstStage = async () => {
            if (!call._id) return;
            try {
                setLoading(true);
                const data = await CallStageApi.getFirstStage(call._id);
                setFirstStage(data);
            } catch (error) {
                console.error("Failed to fetch first stage", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFirstStage();
    }, [call._id]);

    // --- Date Logic via date-fns ---
    const deadline = firstStage?.deadline ? new Date(firstStage.deadline) : null;
    const today = new Date();

    // Calculate actual days remaining
    const daysLeft = deadline ? differenceInCalendarDays(deadline, today) : 0;
    const isClosed = deadline ? isPast(deadline) && daysLeft < 0 : false;
    const isUrgent = daysLeft >= 0 && daysLeft < 5;

    // Data Mapping
    const allocation = call.grantAllocation as GrantAllocation;
    const organization = call.organization as Organization;
    const grant = allocation?.grant as Grant;
    const calendar = allocation?.calendar as Calendar;

    const proceedToApply = () => {
        router.push(`/projects/apply/${call._id}`);
    };

    if (loading) {
        return (
            <Card className="h-full border-1 border-300">
                <div className="flex justify-content-between mb-3">
                    <Skeleton width="4rem" height="1.5rem" />
                    <Skeleton width="6rem" height="1.5rem" />
                </div>
                <Skeleton width="80%" height="1.5rem" className="mb-2" />
                <Skeleton width="100%" height="4rem" className="mb-4" />
                <Skeleton width="100%" height="3rem" />
            </Card>
        );
    }

    return (
        <Card className="h-full border-1 border-300 shadow-hover transition-all transition-duration-300 hover:border-primary flex flex-column">
            {/* TOP SECTION: Metadata */}
            <div className="flex justify-content-between align-items-start mb-2">
                <div className="flex">
                    {calendar?.year && (
                        <Tag
                            severity="info"
                            value={`FY ${calendar.year}`}
                            rounded
                            className="white-space-nowrap bg-bluegray-500"
                        />
                    )}
                </div>

                <div className="text-right ml-2">
                    <small className="block text-500 uppercase font-bold text-xs">
                        {organization?.name || 'Unknown'}
                    </small>
                </div>
            </div>

            {/* MIDDLE SECTION: Titles */}
            <div className="mb-3">
                <span className="text-xs font-bold text-500 uppercase tracking-wider">
                    {grant?.title || "Untitled Grant"}
                </span>
                <h4 className="text-xl font-bold m-0 line-height-3 text-900">
                    {call.title}
                </h4>
            </div>

            <p className="text-600 text-sm mb-4 line-height-3 line-clamp-2">
                {call.description}
            </p>

            {/* HIGHLIGHT SECTION: Financials & Timeline */}
            <div className={`p-3 border-round mb-4 ${isUrgent ? 'bg-orange-50' : 'bg-blue-50'}`}>
                <div className="flex flex-column gap-2">
                    {/* Budget */}
                    <div className="flex align-items-center gap-2">
                        <i className={`pi pi-wallet text-sm ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`}></i>
                        <span className={`text-xs font-bold ${isUrgent ? 'text-orange-800' : 'text-blue-800'}`}>
                            Budget: {new Intl.NumberFormat('en-ET', {
                                style: 'currency',
                                currency: 'ETB',
                                maximumFractionDigits: 0
                            }).format(call.budget || 0)}
                        </span>
                    </div>

                    {/* Deadline Date */}
                    <div className="flex align-items-center gap-2">
                        <i className={`pi pi-calendar text-sm ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`}></i>
                        <span className="text-xs font-medium text-800">
                            Ends: {deadline ? format(deadline, 'MMM dd, yyyy') : 'N/A'}
                        </span>
                    </div>
                </div>

                {/* Status/Countdown */}
                <div className={`flex align-items-center gap-2 border-top-1 pt-2 mt-2 ${isUrgent ? 'border-orange-100' : 'border-blue-100'}`}>
                    <i className={`pi pi-clock ${isUrgent ? 'text-orange-500' : 'text-blue-500'}`}></i>
                    <span className={`text-xs font-bold ${isUrgent ? 'text-orange-700' : 'text-blue-700'}`}>
                        {isClosed ? 'Application Closed' : `${daysLeft} days remaining to apply`}
                    </span>
                </div>
            </div>

            <Divider className="my-3 mt-auto" />

            {/* FOOTER: Actions */}
            <div className="flex align-items-center justify-content-between">
                <div className="flex flex-column">
                    <small className="text-500 text-xs">Funding Source</small>
                    <span className="text-xs font-medium">{(grant?.fundingSource) || 'Internal Fund'}</span>
                </div>
                <Button
                    label={isClosed ? "Closed" : "Apply"}
                    icon={isClosed ? "pi pi-lock" : "pi pi-pencil"}
                    size="small"
                    className={`p-button-raised ${isUrgent ? 'p-button-warning' : ''}`}
                    disabled={isClosed}
                    onClick={proceedToApply}
                />
            </div>
        </Card>
    );
};