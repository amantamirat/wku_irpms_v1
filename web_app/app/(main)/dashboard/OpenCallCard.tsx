'use client';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { useRouter } from 'next/navigation';

// Date Utilities
import { format, differenceInCalendarDays, isPast } from 'date-fns';

// Types
import { Call } from '../calls/models/call.model';
import { Grant } from '../grants/models/grant.model';
import { Calendar } from '../calendars/models/calendar.model';
import { Organization } from '../organizations/models/organization.model';
import { GrantStage } from '../grants/stages/models/grant.stage.model';


interface CallCardProps {
    call: Call;
    onApply?: (callId: string) => void;
}

export const OpenCallCard = ({ call }: CallCardProps) => {
    const router = useRouter();

    // Direct Data Mapping 
    const grant = call.grant as Grant;
    const calendar = call.calendar as Calendar;
    const organization = call.organization as Organization;
    const deadline = call.deadline;
    const today = new Date();

    // Calculate actual days remaining for the primary initial submission
    const daysLeft = deadline ? differenceInCalendarDays(deadline, today) : 0;
    const isClosed = deadline ? isPast(deadline) && daysLeft < 0 : false;
    const isUrgent = daysLeft >= 0 && daysLeft < 5;

    const proceedToApply = () => {
        router.push(`/projects/apply/${call._id}`);
    };

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

            {/* HIGHLIGHT SECTION: Financials & Primary Stage Timeline */}
            <div className={`p-3 border-round mb-3 ${isUrgent ? 'bg-orange-50' : 'bg-blue-50'}`}>
                <div className="flex flex-column gap-2">
                    {/* Budget */}
                    {
                        /**
                         * <div className="flex align-items-center gap-2">
                        <i className={`pi pi-wallet text-sm ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`}></i>
                        <span className={`text-xs font-bold ${isUrgent ? 'text-orange-800' : 'text-blue-800'}`}>
                            Budget: {new Intl.NumberFormat('en-ET', {
                                style: 'currency',
                                currency: 'ETB',
                                maximumFractionDigits: 0
                            }).format(call.budget || 0)}
                        </span>
                    </div>
                         * 
                         */
                    }


                    {/* Call Deadline Date & Time */}
                    <div className="flex align-items-center gap-2">
                        <i className={`pi pi-clock text-sm ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`}></i>
                        <span className="text-xs font-semibold text-800">
                            Deadline: {deadline ? format(new Date(deadline), 'MMM dd, yyyy - hh:mm a') : 'N/A'}
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

            {/* ADDITIONAL SUBSEQUENT DEADLINES (If available) */}
            {
                /**
                 * {sortedDeadlines.length > 1 && (
                <div className="surface-100 p-2 border-round border-1 surface-border mb-4">
                    <span className="block text-xs font-bold uppercase text-500 tracking-wider mb-2 px-1">
                        Subsequent Stage Timelines
                    </span>
                    <div className="flex flex-column gap-2 px-1">
                        {sortedDeadlines.slice(1).map((item: CallDeadline, idx: number) => {
                            const stageName = typeof item.grantStage === 'object'
                                ? (item.grantStage as GrantStage).name
                                : `Stage ${idx + 2}`;

                            return (
                                <div key={idx} className="flex justify-content-between text-xs text-600 border-bottom-1 surface-border pb-1 last:border-none">
                                    <span className="font-medium">{stageName}:</span>
                                    <span className="text-800 font-semibold">
                                        {item.submission ? format(new Date(item.submission), 'MMM dd, yyyy') : 'N/A'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
                 */
            }

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