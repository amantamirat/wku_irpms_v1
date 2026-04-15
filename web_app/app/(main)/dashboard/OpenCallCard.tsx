'use client';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Skeleton } from 'primereact/skeleton'; // For a smoother loading state
import { Tag } from 'primereact/tag';
import { useEffect, useState } from 'react';
import { Calendar } from '../calendars/models/calendar.model';
import { Call } from '../calls/models/call.model';
import { CallStageApi } from '../calls/stages/api/call.stage.api';
import { CallStage } from '../calls/stages/models/call.stage.model';
import { GrantAllocation } from '../grants/allocations/models/grant.allocation.model';
import { Grant } from '../grants/models/grant.model';
import { useRouter } from 'next/navigation';


interface CallCardProps {
    call: Call;
    onApply: (callId: string) => void;
}

export const OpenCallCard = ({ call, onApply }: CallCardProps) => {
    const [stages, setStages] = useState<CallStage[]>([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchStages = async () => {
            if (!call._id) return;
            try {
                setLoading(true);
                // Replace with your actual API call to get stages by call ID
                const data = await CallStageApi.getAll({ call });
                setStages(data);
            } catch (error) {
                console.error("Failed to fetch stages", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStages();
    }, [call._id]);

    // Derived Logic
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);
    const activeStage = sortedStages.find(s => new Date(s.deadline) > new Date()) || sortedStages[sortedStages.length - 1];

    const daysLeft = activeStage
        ? Math.ceil((new Date(activeStage.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    //driven
    const allocation = call.grantAllocation as GrantAllocation;
    const grant = allocation?.grant as Grant;
    const calendar = allocation?.calendar as Calendar;



    const router = useRouter();
    const proceedToApply = () => {
        router.push(`/projects/apply/${call._id}`);
    };

    // --- Loading State Renderer ---
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
        <>
            <Card className="h-full border-1 border-300 shadow-hover transition-all transition-duration-300 hover:border-primary">
                <div className="flex justify-content-between align-items-start mb-2">
                    {/* 🟢 Status & Calendar Year */}
                    <div className="flex gap-2">
                        {
                            //<Tag severity="success" value={call.status} rounded />
                        }
                        {//Fiscal Year
                        }
                        {calendar?.year && (
                            <Tag severity="info" value={`FY ${calendar.year}`} rounded pt={{ root: { className: 'bg-bluegray-500' } }} />
                        )}
                    </div>
                    <div className="text-right">
                        <small className="block text-500 uppercase font-bold text-xs">Current Phase</small>
                        <span className="text-sm font-semibold text-primary">
                            {(activeStage?.grantStage as any)?.name || `Stage ${activeStage?.order || 1}`}
                        </span>
                    </div>
                </div>

                {/* 🔵 Grant & Call Titles */}
                <div className="mb-3">
                    <span className="text-xs font-bold text-500 uppercase tracking-wider">
                        {grant?.title || "Research Grant"}
                    </span>
                    <h4 className="text-xl font-bold m-0 line-height-3 text-900">
                        {call.title}
                    </h4>
                </div>

                <p className="text-600 text-sm mb-4 line-height-3 line-clamp-2">
                    {call.description}
                </p>

                {/* 🟠 Financial & Timeline Context */}
                <div className={`p-3 border-round mb-4 ${daysLeft < 5 ? 'bg-red-50' : 'bg-blue-50'}`}>
                    {/* Container now stacks children vertically with a gap of 2 */}
                    <div className="flex flex-column gap-2">

                        {/* Budget Row */}
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-wallet text-sm text-blue-600"></i>
                            <span className="text-xs font-bold text-blue-800">
                                Budget: {new Intl.NumberFormat('en-ET', {
                                    style: 'currency',
                                    currency: 'ETB',
                                    maximumFractionDigits: 0
                                }).format(allocation?.totalBudget || 0)}
                            </span>
                        </div>

                        {/* Deadline Row */}
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-calendar text-sm text-blue-600"></i>
                            <span className="text-xs font-medium text-blue-800">
                                Ends: {activeStage ? new Date(activeStage.deadline).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Deadline Countdown */}
                    <div className="flex align-items-center gap-2 border-top-1 border-blue-100 pt-2 mt-2">
                        <i className={`pi pi-clock ${daysLeft < 5 ? 'text-red-500' : 'text-blue-500'}`}></i>
                        <span className={`text-xs font-bold ${daysLeft < 5 ? 'text-red-600' : 'text-blue-700'}`}>
                            {daysLeft > 0 ? `${daysLeft} days remaining to apply` : 'Stage Closed'}
                        </span>
                    </div>
                </div>

                <Divider className="my-3" />

                <div className="flex align-items-center justify-content-between mt-auto">
                    <div className="flex flex-column">
                        <small className="text-500 text-xs">Funding Source</small>
                        <span className="text-xs font-medium">{(grant?.fundingSource) || 'Internal Fund'}</span>
                    </div>
                    <Button
                        label="Apply Now"
                        icon="pi pi-pencil"
                        size="small"
                        className="p-button-raised"
                        disabled={daysLeft <= 0}
                        onClick={proceedToApply}
                    />
                </div>
            </Card>
        </>
    );
};