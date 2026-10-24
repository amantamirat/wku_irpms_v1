'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Timeline } from 'primereact/timeline';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import { User } from '@/app/(main)/users/models/user.model';
import MyBadge from '@/templates/MyBadge';

export interface IStatusHistory<TStatus extends string = string> {
    status: TStatus;
    changedBy: string | User;
    reason?: string;
    changedAt: Date | string;
}

interface StatusHistoryWidgetProps<TStatus extends string = string> {
    history?: IStatusHistory<TStatus>[];
    className?: string;
    /** Max width of the timeline column. Default keeps it readable on wide screens. */
    maxWidthClassName?: string;
}

interface Entry<TStatus extends string> {
    item: IStatusHistory<TStatus>;
    time: number;
    isLatest: boolean;
    endTime: number | null;
}

const REASON_CLAMP = 140;
const TOOLTIP_CLASS = 'status-history-date';

/* ---------- helpers ---------- */

const fullFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
const dayFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

const toTime = (date: Date | string) => {
    const t = new Date(date).getTime();
    return Number.isNaN(t) ? 0 : t;
};

const getUserName = (changedBy: string | User) => {
    if (changedBy && typeof changedBy === 'object') return changedBy.name || 'Unknown user';
    return changedBy ? `User #${changedBy}` : 'Unknown user';
};

const formatRelative = (time: number, now: number) => {
    const min = Math.floor(Math.max(0, now - time) / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d ago`;
    return dayFormatter.format(time);
};

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

const formatSpan = (ms: number) => {
    const min = Math.floor(Math.max(0, ms) / 60000);
    if (min < 1) return 'under a minute';
    if (min < 60) return plural(min, 'minute');
    const hr = Math.floor(min / 60);
    if (hr < 24) return plural(hr, 'hour');
    const day = Math.floor(hr / 24);
    if (day < 60) return plural(day, 'day');
    return plural(Math.floor(day / 30), 'month');
};

const useNow = (intervalMs = 60000) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
    return now;
};

/* ---------- reason with show more ---------- */

const Reason = ({ text }: { text: string }) => {
    const [open, setOpen] = useState(false);
    const id = useId();
    const long = text.length > REASON_CLAMP;
    const shown = !long || open ? text : `${text.slice(0, REASON_CLAMP).trimEnd()}…`;

    return (
        <div className="mt-3 flex gap-2.5 rounded-xl border border-slate-200/60 bg-slate-50/80 px-3.5 py-3">
            <i className="pi pi-comment mt-0.5 text-xs text-primary-500 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1 text-sm leading-relaxed text-slate-700">
                <p id={id} className="m-0 whitespace-pre-wrap break-words">
                    {shown}
                </p>
                {long && (
                    <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={id}
                        onClick={() => setOpen((v) => !v)}
                        className="mt-1.5 cursor-pointer rounded border-0 bg-transparent p-0 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
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
    const now = useNow();

    const entries = useMemo<Entry<TStatus>[]>(() => {
        const sorted = (history ?? [])
            .map((item) => ({ item, time: toTime(item.changedAt) }))
            .sort((a, b) => b.time - a.time);

        return sorted.map((entry, i) => ({
            ...entry,
            isLatest: i === 0,
            endTime: i === 0 ? null : sorted[i - 1].time,
        }));
    }, [history]);

    if (entries.length === 0) {
        return (
            <div
                className={`mx-auto ${maxWidthClassName} flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center ${className}`}
            >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-primary-500 shadow-sm">
                    <i className="pi pi-history text-lg" aria-hidden="true" />
                </div>
                <h4 className="m-0 text-sm font-semibold text-slate-900">No status changes yet</h4>
                <p className="mb-0 mt-1 text-xs text-slate-500">
                    Changes will appear here with who made them and why.
                </p>
            </div>
        );
    }

    const marker = ({ isLatest }: Entry<TStatus>) => (
        <span
            className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all ${
                isLatest
                    ? 'bg-primary-600 text-white ring-4 ring-primary-50 shadow-primary-500/20'
                    : 'border border-slate-200 bg-white text-slate-400'
            }`}
        >
            <i
                className={`pi ${isLatest ? 'pi-bolt' : 'pi-circle-fill'}`}
                style={{ fontSize: isLatest ? '0.7rem' : '0.4rem' }}
                aria-hidden="true"
            />
        </span>
    );

    const content = ({ item, time, isLatest, endTime }: Entry<TStatus>) => {
        const span = formatSpan((endTime ?? now) - time);

        return (
            <article
                className={`mb-6 rounded-2xl border p-4.5 transition-all shadow-xs ${
                    isLatest
                        ? 'border-primary-200 bg-white ring-1 ring-primary-100/50 shadow-sm'
                        : 'border-slate-200/70 bg-white/70 hover:bg-white hover:border-slate-300'
                }`}
            >
                {/* Header row: Status badge + Current tag + Relative timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                        <MyBadge type="status" value={item.status} />
                        {isLatest && (
                            <Tag value="Current" severity="success" rounded className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase" />
                        )}
                    </div>

                    <time
                        dateTime={new Date(time).toISOString()}
                        tabIndex={0}
                        className={`${TOOLTIP_CLASS} cursor-default rounded text-xs font-medium text-slate-500 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500`}
                        data-pr-tooltip={fullFormatter.format(time)}
                        data-pr-position="top"
                        suppressHydrationWarning
                    >
                        {formatRelative(time, now)}
                    </time>
                </div>

                {/* Changed by info (fixed truncation / ellipse bug) */}
                <div className="mt-3.5 flex items-center gap-2 text-xs text-slate-600">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <i className="pi pi-user text-[10px]" aria-hidden="true" />
                    </div>
                    <span className="leading-normal break-words">
                        Changed by <span className="font-semibold text-slate-900">{getUserName(item.changedBy)}</span>
                    </span>
                </div>

                {/* Reason box */}
                {item.reason && <Reason text={item.reason} />}

                {/* Duration footer */}
                <div className="mt-3.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 pt-3 border-t border-slate-100">
                    <i className="pi pi-clock text-[10px] text-slate-400" aria-hidden="true" />
                    <span suppressHydrationWarning>
                        {isLatest ? `Active for ${span}` : `Stayed in this status for ${span}`}
                    </span>
                </div>
            </article>
        );
    };

    return (
        <section aria-label="Status history" className={`mx-auto w-full ${maxWidthClassName} ${className}`}>
            <Tooltip target={`.${TOOLTIP_CLASS}`} event="both" />

            <div className="mb-6 flex items-center justify-between px-1">
                <div>
                    <h3 className="m-0 text-base font-bold text-slate-900 tracking-tight">Status history</h3>
                    <p className="mb-0 mt-0.5 text-xs text-slate-500">Timeline of state transitions</p>
                </div>
                <Tag
                    value={plural(entries.length, 'change')}
                    severity="info"
                    rounded
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 border-0"
                />
            </div>

            <Timeline
                value={entries}
                align="left"
                marker={marker}
                content={content}
                pt={{
                    opposite: { className: 'hidden' },
                    event: { className: 'min-h-0' },
                    connector: { className: 'bg-slate-200 w-0.5 my-1' },
                    content: { className: 'pl-5 pr-0 pt-0' },
                }}
            />
        </section>
    );
};