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
import { Dialog } from "primereact/dialog";
import { BASE_URL } from "@/api/ApiClient";

// Models & API


interface EvaluatorManagerProps {
    reviewer: Reviewer; // The current review assignment context
    canEvaluate: boolean;
    onClose: () => void;
}

const EvaluatorManager = ({ reviewer, canEvaluate }: EvaluatorManagerProps) => {

    const toast = useRef<Toast>(null);
    const [lastResults, setLastResults] = useState<Result[]>([]);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [results, setResults] = useState<Result[]>([]);

    const [loading, setLoading] = useState(false);
    //const [isDirty, setIsDirty] = useState(false);
    //const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});


    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                const res = await ResultApi.getAll({
                    reviewer,
                    populate: true,
                });
                const criteria = res.map((r: any) => r.criterion);
                setCriteria(criteria);
                setLastResults(res);
                setResults(res);
            } catch (err) {
                console.error("Failed to fetch results", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [reviewer._id]);

    // Add this helper to compare objects (or use lodash isEqual)
    const isResultChanged = (original: Result, current: Result) => {
        return JSON.stringify(original) !== JSON.stringify(current);
    };

    // Derived State: Compute which items are dirty
    const dirtyIds = useMemo(() => {
        const dirtySet = new Set<string>();

        results.forEach(current => {
            const id = typeof current.criterion === 'string' ? current.criterion : current.criterion._id;
            const original = lastResults.find(r =>
                (typeof r.criterion === 'string' ? r.criterion : r.criterion._id) === id
            );

            // If it's a new result or values differ from original
            if (!original || isResultChanged(original, current)) {
                dirtySet.add(id!!);
            }
        });

        return dirtySet;
    }, [results, lastResults]);

    const isDirty = dirtyIds.size > 0;


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
        setResults(prev => {
            const index = prev.findIndex(r =>
                (typeof r.criterion === 'string' ? r.criterion : r.criterion._id) === criterionId
            );

            if (index === -1) return prev; // Or push new result if applicable

            const newResults = [...prev];
            newResults[index] = { ...newResults[index], ...updates };
            return newResults;
        });
    };


    const onSave = async () => {
        try {
            setLoading(true);

            // Filter results that exist in our dirty set
            const dirtyResults = results.filter(r => {
                const id = typeof r.criterion === 'string' ? r.criterion : r.criterion?._id;
                return id && dirtyIds.has(id);
            });

            if (dirtyResults.length === 0) return;

            await Promise.all(dirtyResults.map(r => ResultApi.update(r)));

            // Sync states: lastResults now equals current results
            setLastResults([...results]);

            toast.current?.show({
                severity: 'success',
                summary: 'Saved',
                detail: `${dirtyResults.length} item(s) updated`
            });
        } catch (err) {
            // ... error handling
        } finally {
            setLoading(false);
        }
    };


    const projectTitle = (reviewer as any).projectStage?.project?.title;
    const documentUrl = (reviewer as any).projectStage?.documentPath;
    const fullUrl = `${BASE_URL}/${documentUrl?.replace(/^\\/, "")}`;

    const isDisabled = !canEvaluate;

    return (
        <>
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
                                    <span className="font-bold">{projectTitle || 'Untitled Project'}</span>
                                </div>
                                <div>
                                    <label className="text-sm text-500 block">Category</label>
                                    <span className="font-medium">{(reviewer as any).project?.category || 'Research'}</span>
                                </div>

                                {documentUrl ? (
                                    <Button
                                        label="Get Full Document"
                                        icon="pi pi-file-pdf"
                                        className="p-button-text p-button-sm"
                                        onClick={() => window.open(fullUrl, "_blank", "noopener,noreferrer")}
                                    />
                                ) : (
                                    <span className="text-gray-400">No File</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Center: The Scrollable List of Criteria Cards */}
                    <div className="col-12 lg:col-6"
                        style={{
                            pointerEvents: isDisabled ? "none" : "auto",
                            opacity: isDisabled ? 0.6 : 1
                        }}
                    >

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
                    onCancel={() => setResults(lastResults)}
                    isDirty={isDirty}
                    loading={loading}
                />
            </div>
        </>
    );
};

export default EvaluatorManager;