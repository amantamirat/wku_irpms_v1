'use client';

import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';

import { etbCurrencyFormatter } from '@/utils/utils';
import { IDirectorateFinancialReport } from '../models/report.types';

interface Props {
    data?: IDirectorateFinancialReport[];
}

const money = (value: number) => etbCurrencyFormatter.format(value || 0);

// short form for small boxes: 85K, 39.8M, 1.2B
const compact = (value: number) => {
    const v = value || 0;
    const abs = Math.abs(v);
    if (abs >= 1_000_000_000) return `ETB ${(v / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `ETB ${(v / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `ETB ${(v / 1_000).toFixed(1)}K`;
    return `ETB ${v.toFixed(0)}`;
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

// tiny values (like 0.21%) stay visible as a small sliver
const barValue = (value: number) => (value > 0 ? Math.max(clamp(value), 1.5) : 0);

export const DirectorateWidget = ({ data }: Props) => {
    if (!data?.length) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <div className="flex flex-col items-center gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                        <i className="pi pi-chart-bar text-2xl text-slate-400" />
                    </span>
                    <div>
                        <h3 className="m-0 text-base font-semibold text-slate-800">
                            No directorate data
                        </h3>
                        <p className="mt-1 mb-0 text-sm text-slate-500">
                            Directorate financial information is not available.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const overCount = data.filter(
        item => (item.committed || 0) > (item.allocated || 0)
    ).length;

    return (
        <section>
            {/* ================= HEADER ================= */}
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                {
                    /**
                     * <div>
                    <h3 className="m-0 text-base font-bold text-slate-900">
                        Directorate Financial Details
                    </h3>
                    <p className="mt-1 mb-0 text-xs text-slate-500">
                        Detailed financial position for each directorate.
                    </p>
                </div>
                     */
                }               

                {overCount > 0 && (
                    <Tag
                        severity="danger"
                        icon="pi pi-exclamation-triangle"
                        value={`${overCount} over-committed`}
                        className="w-fit"
                    />
                )}
            </div>

            {/* ================= GRID ================= */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {data.map(item => {
                    const allocated = item.allocated || 0;
                    const committed = item.committed || 0;
                    const used = item.used || 0;
                    const unallocated = item.unallocated || 0;

                    const utilization = item.utilization || 0;
                    const commitment = item.commitmentRate || 0;

                    // derived values
                    const overCommitted = committed > allocated;
                    const remaining = allocated - used;
                    const unallocatedPct =
                        allocated > 0 ? (unallocated / allocated) * 100 : 0;

                    return (
                        <article
                            key={item._id}
                            className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                                overCommitted ? 'border-rose-200' : 'border-slate-200'
                            }`}
                        >
                            {/* Status strip */}
                            <div
                                className={`absolute inset-x-0 top-0 h-1 ${
                                    overCommitted ? 'bg-rose-500' : 'bg-indigo-500'
                                }`}
                            />

                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                            overCommitted
                                                ? 'bg-rose-50 text-rose-600'
                                                : 'bg-indigo-50 text-indigo-600'
                                        }`}
                                    >
                                        <i className="pi pi-building" />
                                    </div>

                                    <div className="min-w-0">
                                        <h4 className="m-0 truncate text-sm font-bold text-slate-900">
                                            {item.name}
                                        </h4>
                                        <p className="mt-1 mb-0 text-xs text-slate-500">
                                            {item.grantCount} grants · {item.projectCount} projects
                                        </p>
                                    </div>
                                </div>

                                <Tag
                                    severity={overCommitted ? 'danger' : 'success'}
                                    value={overCommitted ? 'Over' : 'Healthy'}
                                    className="shrink-0 text-[10px]"
                                />
                            </div>

                            {/* Allocated */}
                            <div className="mt-5">
                                <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Allocated budget
                                </p>
                                <p className="mt-1 mb-0 text-xl font-bold tracking-tight text-slate-900">
                                    {money(allocated)}
                                </p>
                            </div>

                            {/* Three financial figures */}
                            <div className="mt-5 grid grid-cols-3 gap-2">
                                <div className="rounded-xl bg-slate-50 p-3" title={money(used)}>
                                    <span className="block text-[10px] text-slate-400">Used</span>
                                    <span className="mt-1 block truncate text-xs font-bold text-amber-600">
                                        {compact(used)}
                                    </span>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-3" title={money(committed)}>
                                    <span className="block text-[10px] text-slate-400">
                                        Committed
                                    </span>
                                    <span
                                        className={`mt-1 block truncate text-xs font-bold ${
                                            overCommitted ? 'text-rose-600' : 'text-sky-600'
                                        }`}
                                    >
                                        {compact(committed)}
                                    </span>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-3" title={money(remaining)}>
                                    <span className="block text-[10px] text-slate-400">
                                        Remaining
                                    </span>
                                    <span className="mt-1 block truncate text-xs font-bold text-emerald-600">
                                        {compact(remaining)}
                                    </span>
                                </div>
                            </div>

                            {/* Utilization progress */}
                            <div className="mt-5">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Utilization</span>
                                    <span className="text-xs font-bold text-amber-600">
                                        {utilization.toFixed(2)}%
                                    </span>
                                </div>

                                <ProgressBar
                                    value={barValue(utilization)}
                                    showValue={false}
                                    style={{ height: '6px' }}
                                    className="bg-slate-100 [&>.p-progressbar-value]:bg-amber-500"
                                />
                            </div>

                            {/* Commitment progress */}
                            <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Commitment</span>
                                    <span
                                        className={`text-xs font-bold ${
                                            overCommitted ? 'text-rose-600' : 'text-sky-600'
                                        }`}
                                    >
                                        {commitment.toFixed(2)}%
                                    </span>
                                </div>

                                <ProgressBar
                                    value={barValue(commitment)}
                                    showValue={false}
                                    style={{ height: '6px' }}
                                    className={`bg-slate-100 ${
                                        overCommitted
                                            ? '[&>.p-progressbar-value]:bg-rose-500'
                                            : '[&>.p-progressbar-value]:bg-sky-500'
                                    }`}
                                />
                            </div>

                            {/* Footer: unallocated */}
                            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-slate-500">
                                        Unallocated
                                    </span>
                                    <i
                                        className="pi pi-info-circle cursor-help text-[11px] text-slate-400"
                                        title="Budget not yet committed to any grant or project (Allocated − Committed)."
                                    />
                                </div>

                                <div className="text-right">
                                    <span className="block text-sm font-bold text-slate-800">
                                        {money(unallocated)}
                                    </span>
                                    <span className="block text-[10px] text-slate-400">
                                        {unallocatedPct.toFixed(1)}% of budget
                                    </span>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};