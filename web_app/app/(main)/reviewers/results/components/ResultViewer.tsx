import { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { ResultApi } from "../api/result.api"; // adjust path
import { ReviewerStatus } from "../../models/reviewer.model";

interface Props {
    application?: string;
    verification?: string;
}

interface ResultRow {
    _id: string;
    reviewer: string;
    criterion: { _id: string; title: string; weight: number; order: number };
    score?: number | null;
    comment?: string;
}

interface Totals {
    totalWeight: number; // Σ weight = maximum possible score
    totalScore: number; // Σ score
    result: number | null; // totalScore / totalWeight (0..1)
}

interface ReviewerGroup extends Totals {
    reviewerId: string;
    rows: ResultRow[];
}

const getMax = (r: ResultRow) => r.criterion?.weight ?? 0;
const isScored = (r: ResultRow) => typeof r.score === "number";

const computeTotals = (rows: ResultRow[]): Totals => {
    // Total weight counts every criterion, so an unscored one counts as 0 out of its max.
    const totalWeight = rows.reduce((s, r) => s + getMax(r), 0);
    const totalScore = rows.reduce((s, r) => s + (isScored(r) ? (r.score as number) : 0), 0);
    return {
        totalWeight,
        totalScore,
        result: totalWeight > 0 ? totalScore / totalWeight : null,
    };
};

const formatPercent = (v: number | null) => (v === null ? "N/A" : `${(v * 100).toFixed(1)}%`);

const severityFor = (v: number | null): "success" | "info" | "warning" | "danger" => {
    if (v === null) return "warning";
    if (v >= 0.75) return "success";
    if (v >= 0.5) return "info";
    if (v >= 0.35) return "warning";
    return "danger";
};

const NeutralTag = ({ value }: { value: React.ReactNode }) => (
    <Tag
        value={value}
        style={{ background: "var(--surface-200)", color: "var(--text-color-secondary)" }}
    />
);

const Stat = ({ label, value, icon }: { label: string; value: React.ReactNode; icon: string }) => (
    <div className="surface-card border-1 surface-border border-round-xl p-3 flex-1 flex align-items-center gap-3 shadow-1">
        <div
            className="flex align-items-center justify-content-center border-round-lg bg-primary-100 text-primary"
            style={{ width: "2.75rem", height: "2.75rem" }}
        >
            <i className={`pi ${icon} text-xl`} />
        </div>
        <div className="flex flex-column">
            <span className="text-500 text-sm">{label}</span>
            <span className="text-2xl font-bold">{value}</span>
        </div>
    </div>
);

export default function ResultViewer({ application, verification }: Props) {
    const [results, setResults] = useState<ResultRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!application && !verification) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        ResultApi.getAll({ application, verification, reviewerStatus: ReviewerStatus.accepted })
            .then((data) => {
                if (!cancelled) setResults((data ?? []) as unknown as ResultRow[]);
            })
            .catch((err: any) => {
                if (!cancelled) setError(err?.message ?? "Failed to load results");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [application, verification]);

    const groups = useMemo<ReviewerGroup[]>(() => {
        const map = new Map<string, ResultRow[]>();
        results.forEach((r) => {
            const key = String(r.reviewer);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(r);
        });

        return Array.from(map.entries()).map(([reviewerId, rows]) => ({
            reviewerId,
            rows: [...rows].sort((a, b) => (a.criterion?.order ?? 0) - (b.criterion?.order ?? 0)),
            ...computeTotals(rows),
        }));
    }, [results]);

    // Overall = average of each reviewer's percentage
    const overall = useMemo(() => {
        const vals = groups.map((g) => g.result).filter((a): a is number => a !== null);
        return vals.length ? vals.reduce((s, a) => s + a, 0) / vals.length : null;
    }, [groups]);

    if (loading)
        return (
            <div className="flex justify-content-center p-5">
                <ProgressSpinner style={{ width: "3rem", height: "3rem" }} />
            </div>
        );
    if (error) return <Message severity="error" text={error} className="w-full" />;
    if (groups.length === 0) return <Message severity="warn" text="No results found!" className="w-full" />;

    return (
        <div className="flex flex-column gap-4">
            <div className="flex flex-column md:flex-row gap-3">
                <Stat label="Overall result" icon="pi-chart-line" value={formatPercent(overall)} />
                <Stat label="Reviewers" icon="pi-users" value={groups.length} />
            </div>

            <Accordion multiple activeIndex={[0]}>
                {groups.map((group, i) => (
                    <AccordionTab
                        key={group.reviewerId}
                        header={
                            <div className="flex align-items-center justify-content-between w-full gap-3 flex-wrap">
                                <span className="font-semibold">
                                    <i className="pi pi-user mr-2" />
                                    Reviewer #{i + 1}
                                </span>
                                <div className="flex align-items-center gap-2 flex-wrap">
                                    <NeutralTag value={`Total weight: ${group.totalWeight}`} />
                                    <NeutralTag value={`Total score: ${group.totalScore}`} />
                                    <Tag
                                        severity={severityFor(group.result)}
                                        value={`${group.totalScore} / ${group.totalWeight} = ${formatPercent(group.result)}`}
                                    />
                                </div>
                            </div>
                        }
                    >
                        <DataTable
                            value={group.rows}
                            dataKey="_id"
                            size="small"
                            stripedRows
                            showGridlines
                            responsiveLayout="scroll"
                        >
                            <Column
                                header="Criterion"
                                body={(r: ResultRow) => r.criterion?.title ?? "-"}
                                footer={<span className="font-bold">Total</span>}
                            />
                            <Column
                                header="Weight (max)"
                                align="center"
                                style={{ width: "8rem" }}
                                body={(r: ResultRow) => r.criterion?.weight ?? "-"}
                                footer={<span className="font-bold">{group.totalWeight}</span>}
                            />
                            <Column
                                header="Score"
                                align="center"
                                style={{ width: "8rem" }}
                                body={(r: ResultRow) =>
                                    isScored(r) ? (
                                        <Tag
                                            value={r.score as number}
                                            severity={severityFor(getMax(r) > 0 ? (r.score as number) / getMax(r) : null)}
                                            rounded
                                        />
                                    ) : (
                                        "-"
                                    )
                                }
                                footer={<span className="font-bold">{group.totalScore}</span>}
                            />
                            <Column
                                header="Comment"
                                body={(r: ResultRow) =>
                                    r.comment ? (
                                        <span className="line-height-3">{r.comment}</span>
                                    ) : (
                                        <span className="text-400">-</span>
                                    )
                                }
                                footer={
                                    <div className="flex justify-content-end">
                                        <Tag
                                            severity={severityFor(group.result)}
                                            value={`Total score / Total weight = ${formatPercent(group.result)}`}
                                        />
                                    </div>
                                }
                            />
                        </DataTable>
                    </AccordionTab>
                ))}
            </Accordion>
        </div>
    );
}