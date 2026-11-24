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

interface ReviewerGroup {
    reviewerId: string;
    rows: ResultRow[];
    average: number | null;
}

// Weighted average over scored criteria (falls back to weight 1)
const computeAverage = (rows: ResultRow[]): number | null => {
    const scored = rows.filter(r => typeof r.score === "number");
    if (scored.length === 0) return null;

    const totalWeight = scored.reduce((sum, r) => sum + (r.criterion?.weight || 1), 0);
    const weighted = scored.reduce(
        (sum, r) => sum + (r.score as number) * (r.criterion?.weight || 1),
        0
    );
    return totalWeight ? weighted / totalWeight : null;
};

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

    // Group by reviewer
    const groups = useMemo<ReviewerGroup[]>(() => {
        const map = new Map<string, ResultRow[]>();

        results.forEach(r => {
            const key = String(r.reviewer);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(r);
        });

        return Array.from(map.entries()).map(([reviewerId, rows]) => ({
            reviewerId,
            rows: [...rows].sort(
                (a, b) => (a.criterion?.order ?? 0) - (b.criterion?.order ?? 0)
            ),
            average: computeAverage(rows),
        }));
    }, [results]);

    const overallAverage = useMemo(() => {
        const avgs = groups.map(g => g.average).filter((a): a is number => a !== null);
        return avgs.length ? avgs.reduce((s, a) => s + a, 0) / avgs.length : null;
    }, [groups]);

    if (loading) return <ProgressSpinner />;
    if (error) return <Message severity="error" text={error} />;
    if (groups.length === 0) return <Message severity="warn" text="No results found!" />;

    return (
        <div className="flex flex-column gap-3">
            <div className="flex align-items-center gap-2">
                <span className="font-semibold">Overall average:</span>
                <Tag
                    value={overallAverage !== null ? overallAverage.toFixed(2) : "N/A"}
                    severity="info"
                />
                <span className="text-500">({groups.length} reviewers)</span>
            </div>

            <Accordion multiple activeIndex={[0]}>
                {groups.map((group, i) => (
                    <AccordionTab
                        key={group.reviewerId}
                        header={
                            <div className="flex align-items-center justify-content-between w-full">
                                <span>Reviewer #{i + 1}</span>
                                <Tag
                                    value={
                                        group.average !== null
                                            ? `Avg: ${group.average.toFixed(2)}`
                                            : "No score"
                                    }
                                    severity={group.average !== null ? "success" : "warning"}
                                />
                            </div>
                        }
                    >
                        <DataTable value={group.rows} dataKey="_id" size="small" stripedRows>
                            <Column
                                header="Criterion"
                                body={(r: ResultRow) => r.criterion?.title ?? "-"}
                            />
                            <Column
                                header="Weight"
                                style={{ width: "6rem" }}
                                body={(r: ResultRow) => r.criterion?.weight ?? "-"}
                            />
                            <Column
                                header="Score"
                                style={{ width: "6rem" }}
                                body={(r: ResultRow) => r.score ?? "-"}
                            />
                            <Column
                                header="Comment"
                                body={(r: ResultRow) => r.comment || "-"}
                            />
                        </DataTable>
                    </AccordionTab>
                ))}
            </Accordion>
        </div>
    );
}