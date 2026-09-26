'use client';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { ListSkeleton } from '@/components/Skeletons';
import { StageApi } from '../calls/stages/api/stage.api';
import { Stage } from '../calls/stages/models/stage.model';

const AvailableStages = () => {
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const { hasPermission } = useAuth();

    useEffect(() => {
        const loadAvailableStages = async () => {
            try {
                const data = await StageApi.getAvailable();
                setStages(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to load available stages', error);
            } finally {
                setLoading(false);
            }
        };

        loadAvailableStages();
    }, []);

    const handleSubmit = (stageId?: string) => {
        if (!stageId) return;
        router.push(`/applications/stage/submit/${stageId}`);
    };

    if (loading) {
        return <ListSkeleton />;
    }

    if (!stages.length) {
        return (
            <div className="surface-card border-1 surface-border border-round-xl p-4">
                <div className="flex align-items-center gap-3">
                    <div
                        className="flex align-items-center justify-content-center border-round-lg bg-primary-50 text-primary flex-shrink-0"
                        style={{ width: '2.75rem', height: '2.75rem' }}
                    >
                        <i className="pi pi-list-check text-xl" />
                    </div>
                    <div>
                        <div className="text-900 font-semibold mb-1">No available stages</div>
                        <div className="text-500 text-sm">There are currently no stages available for submission.</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="surface-card border-1 surface-border border-round-xl overflow-hidden shadow-sm">
            {/* HEADER */}
            <div className="flex align-items-center justify-content-between p-4 border-bottom-1 surface-border">
                <div className="flex align-items-center gap-3">
                    <div
                        className="flex align-items-center justify-content-center border-round-lg bg-primary-50 text-primary flex-shrink-0"
                        style={{ width: '2.75rem', height: '2.75rem' }}
                    >
                        <i className="pi pi-list-check text-xl" />
                    </div>
                    <div>
                        <div className="text-900 font-semibold text-lg">Available Stages</div>
                        <div className="text-500 text-sm mt-1">Complete your application before the deadline</div>
                    </div>
                </div>

                <Tag value={`${stages.length} Available`} severity="info" rounded />
            </div>

            {/* LIST */}
            <div>
                {stages.map((stage, index) => {
                    const call = typeof stage.call === 'object' ? stage.call : null;
                    const callTitle = call?.title || 'Project Call';
                    const stageName = stage.name || `Stage ${stage.order}`;
                    
                    const deadline = stage.deadline ? new Date(stage.deadline) : null;
                    const isValidDate = deadline !== null && !isNaN(deadline.getTime());
                    const now = Date.now();
                    const isExpired = isValidDate && deadline!.getTime() < now;
                    
                    const daysRemaining = isValidDate
                        ? Math.ceil((deadline!.getTime() - now) / (1000 * 60 * 60 * 24))
                        : null;

                    const isUrgent = isValidDate && !isExpired && daysRemaining !== null && daysRemaining <= 3;
                    const isLast = index === stages.length - 1;

                    // Date badge styling
                    const dateBadgeClass = isUrgent
                        ? 'bg-orange-50 text-orange-700'
                        : isExpired
                        ? 'bg-red-50 text-red-600'
                        : 'bg-primary-50 text-primary';

                    return (
                        <div
                            key={stage._id || `stage-${index}`}
                            className={`p-4 flex align-items-center justify-content-between gap-4 ${
                                !isLast ? 'border-bottom-1 surface-border' : ''
                            }`}
                        >
                            <div className="flex align-items-center gap-3 min-w-0 flex-grow-1">
                                {/* DATE BOX */}
                                <div
                                    className={`flex flex-column align-items-center justify-content-center border-round-xl flex-shrink-0 ${dateBadgeClass}`}
                                    style={{ width: '4rem', height: '4rem' }}
                                >
                                    {isValidDate ? (
                                        <>
                                            <span className="text-xs font-semibold uppercase">
                                                {format(deadline!, 'MMM')}
                                            </span>
                                            <span className="text-2xl font-bold line-height-1">
                                                {format(deadline!, 'dd')}
                                            </span>
                                        </>
                                    ) : (
                                        <i className="pi pi-calendar text-xl" />
                                    )}
                                </div>

                                {/* CONTENT INFO */}
                                <div className="min-w-0 flex-grow-1">
                                    <div className="flex align-items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-900 font-semibold text-base truncate">
                                            {callTitle}
                                        </span>
                                        {isUrgent && <Tag value="Due Soon" severity="warning" rounded className="text-xs px-2 py-0" />}
                                        {isExpired && <Tag value="Expired" severity="danger" rounded className="text-xs px-2 py-0" />}
                                    </div>

                                    <div className="flex align-items-center gap-2 text-600 text-sm mb-1">
                                        <i className="pi pi-list-check text-xs" />
                                        <span>{stageName}</span>
                                    </div>

                                    <div className="flex align-items-center gap-2 text-sm">
                                        <i className="pi pi-clock text-500 text-xs" />
                                        {isValidDate ? (
                                            <span
                                                className={
                                                    isUrgent
                                                        ? 'text-orange-700 font-medium'
                                                        : isExpired
                                                        ? 'text-red-600'
                                                        : 'text-500'
                                                }
                                            >
                                                {isExpired
                                                    ? `Deadline was ${format(deadline!, 'MMM dd, yyyy')}`
                                                    : `Due ${format(deadline!, 'MMM dd, yyyy')}`}
                                            </span>
                                        ) : (
                                            <span className="text-500">Deadline not specified</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ACTION BUTTON - Small & Compact */}
                            {hasPermission && hasPermission('application:submit') && (
                                <div className="flex-shrink-0">
                                    <Button
                                        label="Submit"
                                        icon="pi pi-arrow-right"
                                        iconPos="right"
                                        size="small"
                                        rounded
                                        className="p-button-sm text-sm px-3 py-2"
                                        disabled={!stage._id || isExpired}
                                        onClick={() => handleSubmit(stage._id)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AvailableStages;