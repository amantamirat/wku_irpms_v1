'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import { VerificationConfigurationApi } from '../verifications/verification-conf/api/verification-conf.api';
import {
    VerificationConfiguration,
    VerificationConfigurationStatus
} from '../verifications/verification-conf/models/verification-conf.model';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from '@/contexts/auth-context';

const VerificationWindow = () => {
    const [configurations, setConfigurations] = useState<
        VerificationConfiguration[]
    >([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const { hasPermission } = useAuth();

    useEffect(() => {
        const loadUpcomingVerifications = async () => {
            try {
                const data = await VerificationConfigurationApi.lookup!({
                    status: VerificationConfigurationStatus.active
                });

                setConfigurations(Array.isArray(data) ? data : []);
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

    const handleSubmit = (configId?: string) => {
        if (!configId) return;

        router.push(`/verifications/submit/${configId}`);
    };

    if (loading) {
        return (
            <div className="flex justify-content-center p-5">
                <ProgressSpinner />
            </div>
        );
    }

    if (!configurations.length) {
        return (
            <div className="surface-card border-1 surface-border border-round-xl p-4">
                <div className="flex align-items-center gap-3">
                    <div
                        className="flex align-items-center justify-content-center border-round-lg bg-blue-50 text-blue-600"
                        style={{ width: '2.75rem', height: '2.75rem' }}
                    >
                        <i className="pi pi-check-circle text-xl" />
                    </div>

                    <div>
                        <div className="text-900 font-semibold mb-1">
                            No verification windows
                        </div>
                        <div className="text-500 text-sm">
                            There are currently no active verification deadlines.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="surface-card border-1 surface-border border-round-xl overflow-hidden">
            {/* HEADER */}
            <div className="flex align-items-center justify-content-between p-4 border-bottom-1 surface-border">
                <div className="flex align-items-center gap-3">
                    <div
                        className="flex align-items-center justify-content-center border-round-lg bg-primary-50 text-primary"
                        style={{ width: '2.75rem', height: '2.75rem' }}
                    >
                        <i className="pi pi-calendar-clock text-xl" />
                    </div>

                    <div>
                        <div className="text-900 font-semibold text-lg">
                            Verification Windows
                        </div>
                        <div className="text-500 text-sm mt-1">
                            Complete your verification before the deadline
                        </div>
                    </div>
                </div>

                <Tag
                    value={`${configurations.length} Active`}
                    severity="info"
                    rounded
                />
            </div>

            {/* LIST */}
            <div className="p-0">
                {configurations.map((config, index) => {
                    const grantObj =
                        typeof config.grant === 'object' && config.grant
                            ? (config.grant as any)
                            : null;

                    const grantTitle = grantObj?.title || 'Grant';

                    const orgObj =
                        grantObj &&
                            typeof grantObj.organization === 'object'
                            ? grantObj.organization
                            : null;

                    const orgName = orgObj?.name || '';

                    const deadlineRaw =
                        config.deadline ||
                        (config as any).dueDate ||
                        (config as any).verificationDeadline;

                    const deadline = deadlineRaw
                        ? new Date(deadlineRaw)
                        : null;

                    const isValidDate =
                        deadline !== null &&
                        !isNaN(deadline.getTime());

                    const now = Date.now();

                    const isExpired =
                        isValidDate && deadline.getTime() < now;

                    const daysRemaining =
                        isValidDate
                            ? Math.ceil(
                                (deadline.getTime() - now) /
                                (1000 * 60 * 60 * 24)
                            )
                            : null;

                    const isUrgent =
                        isValidDate &&
                        !isExpired &&
                        daysRemaining !== null &&
                        daysRemaining <= 3;

                    const isLast =
                        index === configurations.length - 1;

                    return (
                        <div
                            key={config._id || `verification-${index}`}
                            className={`p-4 ${!isLast ? 'border-bottom-1 surface-border' : ''
                                }`}
                        >
                            <div className="flex align-items-center gap-3">
                                {/* DATE */}
                                <div
                                    className={`
                                        flex flex-column align-items-center
                                        justify-content-center
                                        border-round-xl
                                        flex-shrink-0
                                        ${isUrgent
                                            ? 'bg-orange-50 text-orange-700'
                                            : isExpired
                                                ? 'bg-red-50 text-red-600'
                                                : 'bg-primary-50 text-primary'
                                        }
                                    `}
                                    style={{
                                        width: '4rem',
                                        height: '4rem'
                                    }}
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

                                {/* CONTENT */}
                                <div className="flex-grow-1 min-w-0">
                                    <div className="flex align-items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-900 font-semibold">
                                            {grantTitle}
                                        </span>

                                        {isUrgent && (
                                            <Tag
                                                value="Due Soon"
                                                severity="warning"
                                                rounded
                                            />
                                        )}

                                        {isExpired && (
                                            <Tag
                                                value="Expired"
                                                severity="danger"
                                                rounded
                                            />
                                        )}
                                    </div>

                                    {orgName && (
                                        <div className="flex align-items-center gap-2 text-500 text-sm mb-2">
                                            <i className="pi pi-building text-xs" />
                                            <span>{orgName}</span>
                                        </div>
                                    )}

                                    <div className="flex align-items-center gap-2 text-sm">
                                        <i className="pi pi-clock text-500" />

                                        {isValidDate ? (
                                            <span
                                                className={
                                                    isUrgent
                                                        ? 'text-orange-700 font-medium'
                                                        : isExpired
                                                            ? 'text-red-600'
                                                            : 'text-600'
                                                }
                                            >
                                                {isExpired
                                                    ? `Deadline was ${format(
                                                        deadline!,
                                                        'MMM dd, yyyy'
                                                    )}`
                                                    : `Due ${format(
                                                        deadline!,
                                                        'MMM dd, yyyy'
                                                    )}`}
                                            </span>
                                        ) : (
                                            <span className="text-500">
                                                Deadline not specified
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* ACTION (Rendered only if user has verification:submit permission) */}
                                {hasPermission && hasPermission('verification:submit') && (
                                    <div className="flex-shrink-0">
                                        <Button
                                            label="Submit"
                                            icon="pi pi-arrow-right"
                                            iconPos="right"
                                            size="small"
                                            rounded
                                            disabled={
                                                !config._id || isExpired
                                            }
                                            onClick={() =>
                                                handleSubmit(config._id)
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VerificationWindow;