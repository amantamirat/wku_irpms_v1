import { useMemo, useState } from 'react';
import { Timeline } from 'primereact/timeline';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import { User } from '@/app/(main)/users/models/user.model';
import MyBadge from '@/templates/MyBadge';

export interface IStatusHistory<TStatus extends string = string> {
    status: TStatus;
    changedBy: string | User;
    reason?: string;
    changedAt: Date;
}

interface StatusHistoryWidgetProps<TStatus extends string = string> {
    history?: IStatusHistory<TStatus>[];
    className?: string;
    /** Max width of the timeline column. Default keeps it readable on wide screens. */
    maxWidthClassName?: string;
}

const REASON_CLAMP = 140;

/* ---------- helpers ---------- */

const getUserDetails = (changedBy: string | User) => {
    if (typeof changedBy === 'object' && changedBy !== null) {
        const name = changedBy.name || 'Unknown user';
        const image = (changedBy as any).avatar || (changedBy as any).image;
        const initials = name
            .split(' ')
            .filter(Boolean)
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
        return { name, image, initials };
    }
    return { name: `User ${changedBy}`, image: undefined, initials: 'ID' };
};

const formatFull = (date: Date) => {
    const d = new Date(date);
    return `${d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

const formatRelative = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d ago`;
    return new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const formatSpan = (ms: number) => {
    const min = Math.floor(ms / 60000);
    if (min < 1) return 'under a minute';
    if (min < 60) return `${min} min`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr`;
    const day = Math.floor(hr / 24);
    return `${day} ${day === 1 ? 'day' : 'days'}`;
};

/* ---------- reason with show more ---------- */

const Reason = ({ text }: { text: string }) => {
    const [open, setOpen] = useState(false);
    const long = text.length > REASON_CLAMP;
    const shown = !long || open ? text : `${text.slice(0, REASON_CLAMP).trimEnd()}…`;

    return (
        <div className="mt-3 flex gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
            <i className="pi pi-comment mt-0.5 text-xs text-gray-400" />
            <div className="min-w-0 text-sm leading-relaxed text-gray-700">
                <p className="m-0 whitespace-pre-wrap break-words">{shown}</p>
                {long && (
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="mt-1 cursor-pointer border-0 bg-transparent p-0 text-xs font-medium text-primary-600 hover:underline"
                    >
                        {open ? 'Show less' : 'Show more'}
                    </button>
                )}
            </div>
        </div>
    );
};

/* ---------- main ---------- */

export const StatusHistoryWidget = <TStatus extends string = string>({
    history,
    className = '',
    maxWidthClassName = 'max-w-2xl',
}: StatusHistoryWidgetProps<TStatus>) => {
    const sorted = useMemo(
        () =>
            [...(history ?? [])].sort(
                (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
            ),
        [history]
    );

    if (sorted.length === 0) {
        return (
            <div
                className={`mx-auto ${maxWidthClassName} flex flex-col items-center rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center ${className}`}
            >
                <i className="pi pi-history mb-3 text-3xl text-gray-400" />
                <h4 className="m-0 text-sm font-semibold text-gray-900">No status changes yet</h4>
                <p className="mt-1 mb-0 text-sm text-gray-500">
                    Every status change will be listed here with who made it and why.
                </p>
            </div>
        );
    }

    const marker = (item: IStatusHistory<TStatus>) => {
        const isLatest = item === sorted[0];
        return (
            <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isLatest
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-400'
                }`}
            >
                <i className={`pi ${isLatest ? 'pi-check' : 'pi-circle-fill'}`} style={{ fontSize: isLatest ? '0.75rem' : '0.4rem' }} />
            </span>
        );
    };

    const content = (item: IStatusHistory<TStatus>) => {
        const index = sorted.indexOf(item);
        const isLatest = index === 0;
        const { name, image, initials } = getUserDetails(item.changedBy);

        // How long the item stayed in this status
        const start = new Date(item.changedAt).getTime();
        const end = isLatest ? Date.now() : new Date(sorted[index - 1].changedAt).getTime();
        const span = formatSpan(end - start);

        return (
            <div
                className={`mb-5 rounded-xl border p-4 ${
                    isLatest ? 'border-primary-200 bg-primary-50/40' : 'border-gray-200 bg-white'
                }`}
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <MyBadge type="status" value={item.status} />
                        {isLatest && <Tag value="Current" severity="success" rounded className="text-xs" />}
                    </div>

                    <span
                        className="status-history-date cursor-default text-xs text-gray-500"
                        data-pr-tooltip={formatFull(item.changedAt)}
                        data-pr-position="top"
                    >
                        {formatRelative(item.changedAt)}
                    </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <Avatar
                        image={image}
                        label={image ? undefined : initials}
                        shape="circle"
                        className="h-6 w-6 shrink-0 bg-gray-100 text-[10px] font-semibold text-gray-600"
                    />
                    <span className="min-w-0 truncate text-sm text-gray-600">
                        Changed by <span className="font-medium text-gray-900">{name}</span>
                    </span>
                </div>

                {item.reason && <Reason text={item.reason} />}

                <div className="mt-3 text-xs text-gray-400">
                    {isLatest ? `In this status for ${span}` : `Stayed in this status for ${span}`}
                </div>
            </div>
        );
    };

    return (
        <div className={`mx-auto w-full ${maxWidthClassName} ${className}`}>
            <Tooltip target=".status-history-date" />

            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h3 className="m-0 text-base font-semibold text-gray-900">Status history</h3>
                    <p className="mt-1 mb-0 text-sm text-gray-500">Newest changes first</p>
                </div>
                <Tag
                    value={`${sorted.length} ${sorted.length === 1 ? 'change' : 'changes'}`}
                    severity="info"
                    rounded
                />
            </div>

            <Timeline
                value={sorted}
                align="left"
                marker={marker}
                content={content}
                pt={{
                    // Removes the empty "opposite" column that stretches the timeline across the full page
                    opposite: { className: 'hidden' },
                    event: { className: 'min-h-0' },
                    connector: { className: 'bg-gray-200' },
                    content: { className: 'pl-3 pr-0 pt-0' },
                }}
            />
        </div>
    );
};
