'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { VerificationConfigurationApi } from '../verifications/verification-conf/api/verification-conf.api';
import { VerificationConfiguration } from '../verifications/verification-conf/models/verification-conf.model';

const UpcomingVerifications = () => {
    const [configurations, setConfigurations] = useState<VerificationConfiguration[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {
        const loadUpcomingVerifications = async () => {
            try {
                const data = await VerificationConfigurationApi.getUpcoming();
                setConfigurations(Array.isArray(data) ? data.slice(0, 5) : []);
            } catch (error) {
                console.error('Failed to load upcoming verifications', error);
            } finally {
                setLoading(false);
            }
        };

        loadUpcomingVerifications();
    }, []);

    const handleSubmit = (configId?: string) => {
        if (!configId) return;
        router.push(`/verifications/submit/${configId}`);
    };

    if (loading) {
        return <Skeleton width="100%" height="150px" />;
    }

    if (!configurations.length) {
        return (
            <p className="text-500 text-sm">
                No upcoming verification deadlines.
            </p>
        );
    }

    return (
        <ul className="list-none p-0 m-0">
            {configurations.map((config) => {
                const deadlineRaw =
                    config.deadline ||
                    (config as any).dueDate ||
                    (config as any).verificationDeadline;
                const deadline = deadlineRaw ? new Date(deadlineRaw) : null;

                const isUrgent =
                    deadline &&
                    deadline.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

                return (
                    <li
                        key={config._id}
                        className="flex align-items-center py-3 border-bottom-1 surface-border gap-3"
                    >
                        {/* DATE BADGE */}
                        <div
                            className={`flex flex-column align-items-center justify-content-center border-round surface-100 p-2 ${isUrgent ? 'bg-orange-100 text-orange-700' : ''
                                }`}
                            style={{ minWidth: '50px' }}
                        >
                            <span className="text-xs font-bold uppercase">
                                {deadline ? format(deadline, 'MMM') : '--'}
                            </span>
                            <span className="text-xl font-bold">
                                {deadline ? format(deadline, 'dd') : '--'}
                            </span>
                        </div>

                        {/* GRANT TITLE & ORGANIZATION */}
                        <div className="flex-grow-1">
                            <div className="text-900 font-medium mb-1">
                                {typeof config.grant === 'object'
                                    ? (config.grant as any)?.title
                                    : 'Grant'}
                            </div>

                            <div className="text-600 text-sm">
                                {typeof config.grant === 'object' &&
                                    typeof (config.grant as any)?.organization === 'object'
                                    ? (config.grant as any)?.organization?.name
                                    : ''}
                            </div>
                        </div>

                        {/* ACTIONS & TAGS */}
                        <div className="flex align-items-center gap-2">
                            {isUrgent && (
                                <Tag severity="warning" value="Soon" />
                            )}

                            <Button
                                label="Submit"
                                icon="pi pi-arrow-right"
                                iconPos="right"
                                size="small"
                                outlined
                                disabled={!config._id}
                                onClick={() => handleSubmit(config._id)}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default UpcomingVerifications;