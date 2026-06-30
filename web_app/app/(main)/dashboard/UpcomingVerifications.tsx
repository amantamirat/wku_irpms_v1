'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { format } from 'date-fns';
import { GrantStage } from '../grants/stages/models/grant.stage.model';
import { GrantStageApi } from '../grants/stages/api/grant.stage.api';


const UpcomingVerifications = () => {
    const [stages, setStages] = useState<GrantStage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUpcomingVerifications = async () => {
            try {
                const data = await GrantStageApi.getUpcomingVerification();

                setStages(data.slice(0, 5));
            } catch (error) {
                console.error(
                    'Failed to load upcoming verifications',
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        loadUpcomingVerifications();
    }, []);

    if (loading) {
        return <Skeleton width="100%" height="150px" />;
    }

    if (!stages.length) {
        return (
            <p className="text-500 text-sm">
                No upcoming verification deadlines.
            </p>
        );
    }

    return (
        <ul className="list-none p-0 m-0">
            {stages.map((stage) => {
                const deadline = stage.verificationDeadline
                    ? new Date(stage.verificationDeadline)
                    : null;

                const isUrgent =
                    deadline &&
                    deadline.getTime() - Date.now() <
                    3 * 24 * 60 * 60 * 1000;

                return (
                    <li
                        key={stage._id}
                        className="flex align-items-center py-3 border-bottom-1 surface-border"
                    >
                        <div
                            className={`flex flex-column align-items-center justify-content-center border-round surface-100 p-2 mr-3 ${isUrgent
                                    ? 'bg-orange-100 text-orange-700'
                                    : ''
                                }`}
                            style={{ minWidth: '50px' }}
                        >
                            <span className="text-xs font-bold uppercase">
                                {deadline
                                    ? format(deadline, 'MMM')
                                    : '--'}
                            </span>

                            <span className="text-xl font-bold">
                                {deadline
                                    ? format(deadline, 'dd')
                                    : '--'}
                            </span>
                        </div>

                        <div className="flex-grow-1">
                            <div className="text-900 font-medium mb-1">
                                {stage.name}
                            </div>

                            <div className="text-600 text-sm">
                                {typeof stage.grant === 'object'
                                    ? stage.grant.title ??
                                    stage.grant.title
                                    : 'Grant'}
                            </div>
                        </div>

                        {isUrgent && (
                            <Tag
                                severity="warning"
                                value="Soon"
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

export default UpcomingVerifications;