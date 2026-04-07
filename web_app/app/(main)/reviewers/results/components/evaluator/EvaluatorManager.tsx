'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef } from "react";

// Components
import { CriterionCard } from "./CriterionCard";
import { EvaluationSummary } from "./EvaluationSummary";
import { EvaluatorHeader } from "./EvaluatorHeader";
import { ActionToolbar } from "./ActionToolbar";
import { Criterion } from "@/app/(main)/evaluations/models/criterion.model";
import { Reviewer } from "../../../models/reviewer.model";
import { ResultApi } from "../../api/result.api";
import { Result } from "../../models/result.model";

// Models & API


interface EvaluatorManagerProps {
    reviewer: Reviewer; // The current review assignment context
    initialCriteria: Criterion[];
    initialResults: Result[];
    onClose: () => void;
}

const EvaluatorManager = ({ reviewer, initialCriteria, initialResults }: EvaluatorManagerProps) => {
    
    const toast = useRef<Toast>(null);
    const [criteria] = useState<Criterion[]>(initialCriteria);
    const [results, setResults] = useState<Result[]>(initialResults);
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    /* ---------------------------------------------------------
       Logic: Calculate Scores & Progress
    --------------------------------------------------------- */
    const stats = useMemo(() => {
        const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

        const currentScore = results.reduce((sum, res) => {
            const crit = criteria.find(c => c._id === (typeof res.criterion === 'string' ? res.criterion : res.criterion._id));
            if (!crit) return sum;

            // If it's a number field, use the score directly
            if (res.score && !res.selectedOptions?.length) return sum + res.score;

            // If it's options, sum the scores of the selected option IDs
            const selectedIds = (res.selectedOptions || []).map(o => typeof o === 'string' ? o : o._id);
            const optionsScore = crit.options
                ?.filter(opt => selectedIds.includes(opt._id))
                .reduce((s, o) => s + o.score, 0) || 0;

            return sum + optionsScore;
        }, 0);

        const answeredCount = results.filter(r =>
            (r.score !== undefined && r.score > 0) ||
            (r.selectedOptions && r.selectedOptions.length > 0) ||
            (r.comment && r.comment.trim().length > 0)
        ).length;

        const progress = criteria.length > 0 ? Math.round((answeredCount / criteria.length) * 100) : 0;

        return { currentScore, totalWeight, progress, answeredCount };
    }, [results, criteria]);

    /* ---------------------------------------------------------
       Handlers: Update Local State
    --------------------------------------------------------- */
    const handleUpdate = (criterionId: string, updates: Partial<Result>) => {
        setIsDirty(true);
        setResults(prev => {
            const index = prev.findIndex(r =>
                (typeof r.criterion === 'string' ? r.criterion : r.criterion._id) === criterionId
            );

            if (index > -1) {
                const newResults = [...prev];
                newResults[index] = { ...newResults[index], ...updates };
                return newResults;
            } else {
                // Create new result object if it doesn't exist
                return [...prev, {
                    criterion: criterionId,
                    reviewer: reviewer._id,
                    ...updates
                } as Result];
            }
        });
    };

    const onSave = async () => {
        try {
            setLoading(true);
            // Assuming your API has a bulk update or you loop through
            await Promise.all(results.map(r => ResultApi.update(r)));

            toast.current?.show({ severity: 'success', summary: 'Progress Saved', detail: 'Draft updated successfully' });
            setIsDirty(false);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Save Failed', detail: String(err) });
        } finally {
            setLoading(false);
        }
    };

    

    return (
        <div className="layout-evaluator pb-8">
            <Toast ref={toast} />

            {/* Top Progress & Info Header */}
            <EvaluatorHeader
                name={(reviewer.applicant as any)?.name || "Project Review"}
                role="Proposal Evaluation"
                progress={stats.progress}
                currentScore={stats.currentScore}
                totalWeight={stats.totalWeight}
            />

            <div className="grid mt-2">
                {/* Left Side: Proposal/Project Data */}
                <div className="col-12 lg:col-3">
                    <div className="surface-card p-4 border-round shadow-1 sticky top-0">
                        <h4 className="mt-0 border-bottom-1 surface-border pb-2 text-primary">Proposal Details</h4>
                        <div className="flex flex-column gap-3">
                            <div>
                                <label className="text-sm text-500 block">Project Title</label>
                                <span className="font-bold">{(reviewer as any).project?.title || 'Untitled Project'}</span>
                            </div>
                            <div>
                                <label className="text-sm text-500 block">Category</label>
                                <span className="font-medium">{(reviewer as any).project?.category || 'Research'}</span>
                            </div>
                            <Button label="View Full Document" icon="pi pi-external-link" className="p-button-outlined p-button-sm mt-2" />
                        </div>
                    </div>
                </div>

                {/* Center: The Scrollable List of Criteria Cards */}
                <div className="col-12 lg:col-6">
                    {criteria.map(c => (
                        <CriterionCard
                            key={c._id}
                            criterion={c}
                            result={results.find(r => (typeof r.criterion === 'string' ? r.criterion : r.criterion._id) === c._id) || {}}
                            onUpdate={(data) => handleUpdate(c._id!, data)}
                        />
                    ))}
                </div>

                {/* Right Side: Score Summary Knob */}
                <div className="col-12 lg:col-3">
                    <EvaluationSummary
                        currentScore={stats.currentScore}
                        maxScore={stats.totalWeight}
                        answeredCount={stats.answeredCount}
                        totalCount={criteria.length}
                    />
                </div>
            </div>

            {/* Sticky Bottom Actions */}
            <ActionToolbar
                onSave={onSave}
                onCancel={() => setResults(initialResults)}
                isDirty={isDirty}
                loading={loading}
            />
        </div>
    );
};

export default EvaluatorManager;