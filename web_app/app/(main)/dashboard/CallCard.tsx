'use client';

import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { useRouter } from 'next/navigation';
import {
    differenceInCalendarDays,
    format,
    isPast,
} from 'date-fns';

import { useAuth } from '@/contexts/auth-context';
import { Call } from '../calls/models/call.model';
import { Grant } from '../grants/models/grant.model';
import { Calendar } from '../calendars/models/calendar.model';
import { Organization } from '../organizations/models/organization.model';

interface CallCardProps {
    call: Call;
}

export const CallCard = ({ call }: CallCardProps) => {
    const router = useRouter();
    const { hasPermission } = useAuth();

    const grant = call.grant as Grant;
    const calendar = call.calendar as Calendar;
    const organization = call.organization as Organization;

    const deadline = call.deadline ? new Date(call.deadline) : null;

    const daysLeft = deadline
        ? differenceInCalendarDays(deadline, new Date())
        : null;

    const isClosed = deadline ? isPast(deadline) : false;
    const isUrgent =
        daysLeft !== null &&
        daysLeft >= 0 &&
        daysLeft <= 5;

    const canApply =
        hasPermission?.('project:apply') ?? false;

    const apply = () => {
        router.push(`/projects/apply/${call._id}`);
    };

    return (
        <Card className="call-card h-full border-1 border-300 shadow-1 hover:shadow-3 transition-all transition-duration-200">

            {/* Header */}
            <div className="flex justify-content-between align-items-start gap-2 mb-3">
                {calendar?.year && (
                    <Tag
                        value={`FY ${calendar.year}`}
                        severity="info"
                        rounded
                    />
                )}

                <span className="text-xs font-semibold text-color-secondary text-right uppercase letter-spacing-1">
                    {organization?.name ?? 'UO'}
                </span>
            </div>

            {/* Title */}
            <div className="mb-3">
                <div className="text-xs font-semibold text-primary uppercase mb-1">
                    {grant?.title ?? 'Untitled Grant'}
                </div>

                <h3 className="text-lg font-bold text-color m-0 line-height-2">
                    {call.title}
                </h3>
            </div>

            {/* Description */}
            {call.description && (
                <p className="text-sm text-color-secondary line-height-3 m-0 mb-3 line-clamp-2">
                    {call.description}
                </p>
            )}


            {/* Deadline */}
            <div
                className={`call-deadline ${isUrgent ? 'call-deadline-urgent' : ''
                    }`}
            >
                <div className="flex align-items-center gap-2">
                    <i
                        className={`pi pi-calendar ${isUrgent
                            ? 'text-orange-500'
                            : 'text-primary'
                            }`}
                    />

                    <div className="flex-1">
                        <div className="call-deadline-label">
                            Application deadline
                        </div>

                        <div className="call-deadline-date">
                            {deadline
                                ? format(
                                    deadline,
                                    'MMM dd, yyyy • hh:mm a'
                                )
                                : 'No deadline specified'}
                        </div>
                    </div>
                </div>

                {daysLeft !== null && (
                    <div className="call-deadline-status">
                        <span
                            className={
                                isClosed
                                    ? 'text-red-500'
                                    : isUrgent
                                        ? 'text-orange-500'
                                        : 'text-primary'
                            }
                        >
                            {isClosed
                                ? 'Application closed'
                                : daysLeft === 0
                                    ? 'Deadline is today'
                                    : `${daysLeft} days remaining`}
                        </span>
                    </div>
                )}
            </div>

            <Divider className="my-3" />

            {/* Footer */}
            <div className="flex align-items-center justify-content-end">
                {canApply && (
                    <Button
                        label={isClosed ? 'Closed' : 'Apply'}
                        icon={
                            isClosed
                                ? 'pi pi-lock'
                                : 'pi pi-arrow-right'
                        }
                        size="small"
                        severity={
                            isUrgent
                                ? 'warning'
                                : undefined
                        }
                        outlined={!isClosed}
                        disabled={isClosed}
                        onClick={apply}
                    />
                )}
            </div>
        </Card>
    );
};