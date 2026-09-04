'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { format } from 'date-fns';
import { StageApi } from '../calls/stages/api/stage.api';
import { Stage } from '../calls/stages/models/stage.model';
import { VerificationConfigurationApi } from '../verifications/verification-conf/api/verification-conf.api';
import { VerificationConfiguration } from '../verifications/verification-conf/models/verification-conf.model';

interface UnifiedDeadline {
    id: string;
    title: string;
    subtitle: string;
    deadline: Date;
    type: 'stage' | 'verification';
}

const UpcomingDeadlines = () => {
    const [deadlines, setDeadlines] = useState<UnifiedDeadline[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeadlines = async () => {
            try {
                // Fetch upcoming stages and verifications concurrently
                const [stageData, verificationData] = await Promise.all([
                    StageApi.getUpcoming().catch(() => [] as Stage[]),
                    VerificationConfigurationApi.getUpcoming().catch(() => [] as VerificationConfiguration[])
                ]);

                const mappedStages: UnifiedDeadline[] = (stageData || []).map((stage) => {
                    const callTitle = (typeof stage.call === 'object' && stage.call?.title)
                        ? stage.call.title
                        : 'Project Stage';

                    const stageSubtitle = stage.name || `Stage ${stage.order}`;

                    return {
                        id: stage._id || `stage-${Math.random()}`,
                        title: callTitle ?? 'Project Stage', // Fallback ensures it is never undefined
                        subtitle: stageSubtitle,
                        deadline: new Date(stage.deadline),
                        type: 'stage'
                    };
                });

                // Map Verification Configurations
                const mappedVerifications: UnifiedDeadline[] = (verificationData || []).map((conf) => {
                    const grantObj = typeof conf.grant === 'object' ? conf.grant : null;
                    const title = grantObj?.title || 'Grant Verification';

                    const orgObj = grantObj && typeof grantObj.organization === 'object' ? grantObj.organization : null;
                    const subtitle = orgObj?.name || 'Verification Window';

                    return {
                        id: conf._id || `conf-${Math.random()}`,
                        title,
                        subtitle,
                        deadline: new Date(conf.deadline),
                        type: 'verification'
                    };
                });

                const now = new Date().getTime();

                // Merge, filter out past deadlines, sort ascending, and take top 5
                const sorted = [...mappedStages, ...mappedVerifications]
                    .filter((item) => !isNaN(item.deadline.getTime()) && item.deadline.getTime() >= now)
                    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
                    .slice(0, 5);

                setDeadlines(sorted);
            } catch (error) {
                console.error('Failed to load deadlines', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDeadlines();
    }, []);

    if (loading) {
        return <Skeleton width="100%" height="200px" />;
    }

    if (deadlines.length === 0) {
        return <p className="text-500 text-sm">No upcoming deadlines.</p>;
    }

    return (
        <ul className="list-none p-0 m-0">
            {deadlines.map((item) => {
                const isUrgent = item.deadline.getTime() - new Date().getTime() < 86400000 * 3; // 3 days

                return (
                    <li
                        key={item.id}
                        className="flex align-items-center py-3 border-bottom-1 surface-border gap-3"
                    >
                        {/* DATE BADGE */}
                        <div
                            className={`flex flex-column align-items-center justify-content-center border-round surface-100 p-2 ${isUrgent ? 'bg-orange-100 text-orange-700' : ''
                                }`}
                            style={{ minWidth: '50px' }}
                        >
                            <span className="text-xs font-bold uppercase">
                                {format(item.deadline, 'MMM')}
                            </span>
                            <span className="text-xl font-bold">
                                {format(item.deadline, 'dd')}
                            </span>
                        </div>

                        {/* TITLE & SUBTITLE */}
                        <div className="flex-grow-1">
                            <div className="text-900 font-medium mb-1">
                                {item.title}
                            </div>
                            <div className="text-600 text-sm">
                                {item.subtitle}
                            </div>
                        </div>

                        {/* TYPE & URGENCY TAGS */}
                        <div className="flex align-items-center gap-2">
                            {item.type === 'verification' ? (
                                <Tag severity="info" value="Verification" />
                            ) : (
                                <Tag severity="success" value="Stage" />
                            )}

                            {isUrgent && <Tag severity="warning" value="Soon" />}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default UpcomingDeadlines;