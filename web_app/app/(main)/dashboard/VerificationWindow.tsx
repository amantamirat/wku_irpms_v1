'use client';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { VerificationConfigurationApi } from '../verifications/verification-conf/api/verification-conf.api';
import {
    VerificationConfiguration,
    VerificationConfigurationStatus
} from '../verifications/verification-conf/models/verification-conf.model';

const VerificationWindow = () => {
    const [configurations, setConfigurations] = useState<VerificationConfiguration[]>([]);
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
        return (
            <div className="surface-card border-round-xl p-5 shadow-1 flex flex-column align-items-center justify-content-center gap-2">
                <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="4" />
                <span className="text-500 text-sm font-medium">Loading verification windows...</span>
            </div>
        );
    }

    if (!configurations.length) {
        return (
            <div className="surface-card border-round-xl p-4 shadow-1 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-1 border-blue-100">
                <div className="flex align-items-center gap-3">
                    <div className="flex align-items-center justify-content-center border-round-circle bg-blue-100 text-blue-700 p-3 shadow-1" style={{ width: '3rem', height: '3rem' }}>
                        <i className="pi pi-check-circle text-xl" />
                    </div>
                    <div>
                        <div className="text-900 font-bold text-base mb-1">
                            All Caught Up
                        </div>
                        <div className="text-600 text-sm">
                            There are currently no active verification deadlines required.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="surface-card border-round-xl shadow-2 overflow-hidden border-1 surface-border">
            {/* HEADER */}
            <div className="flex align-items-center justify-content-between p-4 bg-surface-50 border-bottom-1 surface-border">
                <div className="flex align-items-center gap-3">
                    <div className="flex align-items-center justify-content-center border-round-xl bg-primary-100 text-primary p-3 shadow-1" style={{ width: '3rem', height: '3rem' }}>
                        <i className="pi pi-calendar-clock text-xl" />
                    </div>
                    <div>
                        <div className="text-900 font-bold text-lg">
                            Verification Windows
                        </div>
                        <div className="text-500 text-sm mt-0.5">
                            Complete your active requirements before the deadline
                        </div>
                    </div>
                </div>

                <Tag
                    value={`${configurations.length} Active`}
                    severity="info"
                    className="px-3 py-1 font-semibold text-xs"
                    rounded
                />
            </div>

            {/* LIST */}
            <div className="p-3 flex flex-column gap-3">
                {configurations.map((config, index) => {
                    const grantObj =
                        typeof config.grant === 'object' && config.grant
                            ? (config.grant as any)
                            : null;

                    const grantTitle = grantObj?.title || 'Verification Task';

                    const orgObj =
                        grantObj && typeof grantObj.organization === 'object'
                            ? grantObj.organization
                            : null;

                    const orgName = orgObj?.name || '';

                    const deadlineRaw =
                        config.deadline ||
                        (config as any).dueDate ||
                        (config as any).verificationDeadline;

                    const deadline = deadlineRaw ? new Date(deadlineRaw) : null;
                    const isValidDate = deadline !== null && !isNaN(deadline.getTime());
                    const now = Date.now();
                    const isExpired = isValidDate && deadline.getTime() < now;
                    const daysRemaining = isValidDate
                        ? Math.ceil((deadline.getTime() - now) / (1000 * 60 * 60 * 24))
                        : null;

                    const isUrgent = isValidDate && !isExpired && daysRemaining !== null && daysRemaining <= 3;

                    return (
                        <div
                            key={config._id || `verification-${index}`}
                            className={`p-3 border-round-xl border-1 transition-all transition-duration-200 ${
                                isUrgent
                                    ? 'bg-orange-50/40 border-orange-200 hover:border-orange-300'
                                    : isExpired
                                    ? 'bg-red-50/30 border-red-200 opacity-80'
                                    : 'bg-white surface-border hover:border-primary-300 shadow-1'
                            }`}
                        >
                            <div className="flex flex-column md:flex-row md:align-items-center justify-content-between gap-3">
                                <div className="flex align-items-start gap-3">
                                    {/* CALENDAR DATE BADGE */}
                                    <div
                                        className={`flex flex-column align-items-center justify-content-center border-round-lg flex-shrink-0 shadow-1 ${
                                            isUrgent
                                                ? 'bg-orange-500 text-white'
                                                : isExpired
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-primary-50 text-primary'
                                        }`}
                                        style={{ width: '3.75rem', height: '3.75rem' }}
                                    >
                                        {isValidDate ? (
                                            <>
                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                    {format(deadline!, 'MMM')}
                                                </span>
                                                <span className="text-xl font-bold line-height-1 mt-0.5">
                                                    {format(deadline!, 'dd')}
                                                </span>
                                            </>
                                        ) : (
                                            <i className="pi pi-calendar text-xl" />
                                        )}
                                    </div>

                                    {/* INFO */}
                                    <div className="flex-grow-1 min-w-0">
                                        <div className="flex align-items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-900 font-bold text-base">
                                                {grantTitle}
                                            </span>

                                            {isUrgent && (
                                                <Tag
                                                    value={`Due in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`}
                                                    severity="warning"
                                                    className="text-xs px-2 py-0.5 font-semibold"
                                                    rounded
                                                />
                                            )}

                                            {isExpired && (
                                                <Tag
                                                    value="Expired"
                                                    severity="danger"
                                                    className="text-xs px-2 py-0.5"
                                                    rounded
                                                />
                                            )}
                                        </div>

                                        {orgName && (
                                            <div className="flex align-items-center gap-2 text-600 text-xs mb-1.5 font-medium">
                                                <i className="pi pi-building text-xs" />
                                                <span>{orgName}</span>
                                            </div>
                                        )}

                                        <div className="flex align-items-center gap-2 text-xs">
                                            <i className="pi pi-clock text-500" />
                                            {isValidDate ? (
                                                <span
                                                    className={
                                                        isUrgent
                                                            ? 'text-orange-700 font-semibold'
                                                            : isExpired
                                                            ? 'text-red-600 font-medium'
                                                            : 'text-600 font-medium'
                                                    }
                                                >
                                                    {isExpired
                                                        ? `Deadline passed on ${format(deadline!, 'MMM dd, yyyy')}`
                                                        : `Deadline: ${format(deadline!, 'MMM dd, yyyy')}`}
                                                </span>
                                            ) : (
                                                <span className="text-500 italic">Deadline not specified</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ACTION BUTTON */}
                                {hasPermission && hasPermission('verification:submit') && (
                                    <div className="flex-shrink-0 flex justify-content-end md:justify-content-center">
                                        <Button
                                            label="Submit Verification"
                                            icon="pi pi-arrow-right"
                                            iconPos="right"
                                            size="small"
                                            className={`font-semibold text-xs shadow-sm ${
                                                isUrgent ? 'p-button-warning' : 'p-button-primary'
                                            }`}
                                            rounded
                                            disabled={!config._id || isExpired}
                                            onClick={() => handleSubmit(config._id)}
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