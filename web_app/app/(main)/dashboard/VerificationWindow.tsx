'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { VerificationConfigurationApi } from '../verifications/verification-conf/api/verification-conf.api';
import { VerificationConfiguration, VerificationConfigurationStatus } from '../verifications/verification-conf/models/verification-conf.model';

const VerificationWindow = () => {
    const [configurations, setConfigurations] = useState<VerificationConfiguration[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {
        const loadUpcomingVerifications = async () => {
            try {
                const data = await VerificationConfigurationApi.getAll({ 
                    status: VerificationConfigurationStatus.active 
                });
                setConfigurations(Array.isArray(data) ? data : []);
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
            <p className="text-500 text-sm m-0">
                No upcoming verification deadlines.
            </p>
        );
    }

    return (
        <ul className="list-none p-0 m-0">
            {configurations.map((config) => {
                // Safely extract populated grant and nested organization
                const grantObj = typeof config.grant === 'object' && config.grant ? (config.grant as any) : null;
                const grantTitle = grantObj?.title || 'Grant';
                
                const orgObj = grantObj && typeof grantObj.organization === 'object' ? grantObj.organization : null;
                const orgName = orgObj?.name || '';

                // Extract valid deadline
                const deadlineRaw =
                    config.deadline ||
                    (config as any).dueDate ||
                    (config as any).verificationDeadline;
                    
                const deadline = deadlineRaw ? new Date(deadlineRaw) : null;
                const isValidDate = deadline && !isNaN(deadline.getTime());

                // Urgency check (3 days)
                const isUrgent =
                    isValidDate &&
                    deadline.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

                return (
                    <li
                        key={config._id || Math.random().toString()}
                        className="flex align-items-center py-3 border-bottom-1 surface-border gap-3"
                    >
                        {/* DATE BADGE */}
                        <div
                            className={`flex flex-column align-items-center justify-content-center border-round surface-100 p-2 ${
                                isUrgent ? 'bg-orange-100 text-orange-700' : ''
                            }`}
                            style={{ minWidth: '50px' }}
                        >
                            <span className="text-xs font-bold uppercase">
                                {isValidDate ? format(deadline, 'MMM') : '--'}
                            </span>
                            <span className="text-xl font-bold">
                                {isValidDate ? format(deadline, 'dd') : '--'}
                            </span>
                        </div>

                        {/* GRANT TITLE & ORGANIZATION */}
                        <div className="flex-grow-1">
                            <div className="text-900 font-medium mb-1">
                                {grantTitle}
                            </div>

                            {orgName && (
                                <div className="text-600 text-sm">
                                    {orgName}
                                </div>
                            )}
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

export default VerificationWindow;