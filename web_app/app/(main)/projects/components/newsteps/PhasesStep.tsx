'use client';
import React, { useState, useMemo } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { Project } from '../../models/project.model';
import { Constraint } from '@/app/(main)/constraints/models/constraint.model';

interface PhasesStepProps {
    data: Partial<Project>;
    constraint?: Constraint;
    onUpdate: (data: Partial<Project>) => void;
    onNext: () => void;
    onBack: () => void;
}

export const PhasesStep = ({ data, constraint, onUpdate, onNext, onBack }: PhasesStepProps) => {
    const [submitted, setSubmitted] = useState(false);

    // --- Constraint Helpers ---
    const formatETB = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(val);

    // --- Validation Logic ---
    const validation = useMemo(() => {
        const phases = data.phases || [];
        const totalBudget = phases.reduce((acc, curr) => acc + (curr.budget || 0), 0);
        const totalDuration = phases.reduce((acc, curr) => acc + (curr.duration || 0), 0);

        // Check Phase Count
        const isCountValid =
            phases.length >= (constraint?.minPhases ?? 0) &&
            phases.length <= (constraint?.maxPhases ?? Infinity);

        // Check Aggregates
        const isTotalBudgetValid =
            totalBudget >= (constraint?.minBudget ?? 0) &&
            totalBudget <= (constraint?.maxBudget ?? Infinity);

        const isTotalTimeValid =
            totalDuration >= (constraint?.minDuration ?? 0) &&
            totalDuration <= (constraint?.maxDuration ?? Infinity);

        // Check Individual Phases
        const phaseErrors = phases.map(p => {
            const budgetErr =
                p.budget < (constraint?.minBudgetPerPhase ?? 0) ||
                p.budget > (constraint?.maxBudgetPerPhase ?? Infinity);

            const timeErr =
                p.duration < (constraint?.minDurationPerPhase ?? 0) ||
                p.duration > (constraint?.maxDurationPerPhase ?? Infinity);

            const basicErr = !p.title?.trim() || !p.description?.trim();
            return !!(budgetErr || timeErr || basicErr);
        });

        const allPhasesValid = !phaseErrors.includes(true);

        return {
            isCountValid,
            isTotalBudgetValid,
            isTotalTimeValid,
            currentCount: phases.length,
            totalBudget,
            totalDuration,
            allPhasesValid,
            isValid: isCountValid && isTotalBudgetValid && isTotalTimeValid && allPhasesValid
        };
    }, [data.phases, constraint]);

    const isMaxReached = !!(constraint?.maxPhases && validation.currentCount >= constraint.maxPhases);

    // --- Actions ---
    const updatePhase = (index: number, field: string, value: any) => {
        const newPhases = [...(data.phases || [])];
        newPhases[index] = { ...newPhases[index], [field]: value };

        const newTotalBudget = newPhases.reduce((acc, curr) => acc + (curr.budget || 0), 0);
        const newTotalDuration = newPhases.reduce((acc, curr) => acc + (curr.duration || 0), 0);

        onUpdate({
            ...data,
            phases: newPhases,
            totalBudget: newTotalBudget,
            totalDuration: newTotalDuration
        });
    };

    const addPhase = () => {
        const newPhases = [...(data.phases || [])];
        newPhases.push({ title: '', order: newPhases.length + 1, budget: 0, duration: 0, description: '' });
        onUpdate({ ...data, phases: newPhases });
    };

    const removePhase = (index: number) => {
        const newPhases = data.phases?.filter((_, i) => i !== index).map((p, idx) => ({ ...p, order: idx + 1 }));
        onUpdate({ ...data, phases: newPhases });
    };

    const validateAndNext = () => {
        setSubmitted(true);
        if (validation.isValid) {
            onNext();
        }
    };

    return (
        <div className="mt-4">
            {/* Global Limits Summary */}
            <div className={classNames("flex flex-column md:flex-row justify-content-between align-items-center mb-4 p-3 border-round-xl border-1", {
                'bg-blue-50 border-blue-100': validation.isTotalBudgetValid && validation.isTotalTimeValid,
                'bg-red-50 border-red-100': submitted && (!validation.isTotalBudgetValid || !validation.isTotalTimeValid)
            })}>
                <div>
                    <h4 className="m-0 text-900">Project Budget & Timeline</h4>
                    <p className="text-600 text-sm m-0">
                        Phases allowed: {constraint?.minPhases ?? 1} - {constraint?.maxPhases ?? '∞'}
                    </p>
                </div>
                <div className="flex gap-4 mt-3 md:mt-0">
                    <div className="text-right">
                        <small className="block text-700 uppercase font-bold text-xs">Total Duration</small>
                        <span className={classNames("text-xl font-bold", validation.isTotalTimeValid ? "text-900" : "text-red-600")}>
                            {validation.totalDuration} / {constraint?.maxDuration ?? '∞'} Days
                        </span>
                    </div>
                    <div className="text-right">
                        <small className="block text-700 uppercase font-bold text-xs">Total Budget</small>
                        <span className={classNames("text-xl font-bold", validation.isTotalBudgetValid ? "text-primary" : "text-red-600")}>
                            {formatETB(validation.totalBudget)}
                        </span>
                        {constraint?.maxBudget && (
                            <small className="block text-500">Max: {formatETB(constraint.maxBudget)}</small>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Messages for Totals */}
            {submitted && !validation.isTotalBudgetValid && (
                <Message
                    severity="error"
                    text={`Total budget must be between ${formatETB(constraint?.minBudget ?? 0)} and ${constraint?.maxBudget ? formatETB(constraint.maxBudget) : 'unlimited'
                        }`}
                    className="w-full mb-3"
                />
            )}
            {submitted && !validation.isTotalTimeValid && (
                <Message
                    severity="error"
                    text={`Total duration must be between ${constraint?.minDuration ?? 0} and ${constraint?.maxDuration ?? '∞'} days.`}
                    className="w-full mb-3"
                />
            )}

            {/* Phase List */}
            {data.phases?.map((phase, index) => {
                const isPhaseBudgetInvalid =
                    submitted &&
                    ((constraint?.minBudgetPerPhase !== undefined && phase.budget < constraint.minBudgetPerPhase) ||
                        (constraint?.maxBudgetPerPhase !== undefined && phase.budget > constraint.maxBudgetPerPhase));

                const isPhaseDurationInvalid =
                    submitted &&
                    ((constraint?.minDurationPerPhase !== undefined && phase.duration < constraint.minDurationPerPhase) ||
                        (constraint?.maxDurationPerPhase !== undefined && phase.duration > constraint.maxDurationPerPhase));

                return (
                    <div key={index} className="card border-1 border-200 surface-50 mb-4 p-3 relative shadow-1 border-round-lg">
                        <div className="flex align-items-center mb-3">
                            <span className="border-circle bg-primary text-white w-2rem h-2rem flex align-items-center justify-content-center font-bold mr-2">
                                {index + 1}
                            </span>
                            <h5 className="m-0 text-700">Phase Details</h5>
                            <Button
                                icon="pi pi-trash"
                                className="p-button-rounded p-button-danger p-button-text ml-auto"
                                onClick={() => removePhase(index)}
                                disabled={(data.phases?.length || 0) <= 1}
                            />
                        </div>

                        <div className="p-fluid grid">
                            <div className="field col-12 md:col-6">
                                <label className="font-bold text-sm">Phase Title</label>
                                <InputText
                                    value={phase.title || ''}
                                    onChange={(e) => updatePhase(index, 'title', e.target.value)}
                                    placeholder={
                                        [
                                            "e.g., Preliminary Research",
                                            "e.g., Design & Planning",
                                            "e.g., Implementation"
                                        ][phase.order - 1] || "e.g., Phase Title"
                                    }
                                    className={classNames({ 'p-invalid': submitted && !phase.title?.trim() })}
                                />
                            </div>

                            <div className="field col-12 md:col-3">
                                <label className="font-bold text-sm">Budget (ETB)</label>
                                <InputNumber
                                    value={phase.budget}
                                    onValueChange={(e) => updatePhase(index, 'budget', e.value)}
                                    mode="currency"
                                    currency="ETB"
                                    locale="en-US"
                                    className={classNames({ 'p-invalid': isPhaseBudgetInvalid })}
                                />
                                {(constraint?.minBudgetPerPhase !== undefined || constraint?.maxBudgetPerPhase !== undefined) && (
                                    <small className="text-500 block mt-1">
                                        Limit: {formatETB(constraint.minBudgetPerPhase ?? 0)} - {constraint.maxBudgetPerPhase ? formatETB(constraint.maxBudgetPerPhase) : '∞'}
                                    </small>
                                )}
                            </div>

                            <div className="field col-12 md:col-3">
                                <label className="font-bold text-sm">Duration (Days)</label>
                                <InputNumber
                                    value={phase.duration}
                                    onValueChange={(e) => updatePhase(index, 'duration', e.value)}
                                    suffix=" Days"
                                    showButtons
                                    min={0}
                                    className={classNames({ 'p-invalid': isPhaseDurationInvalid })}
                                />
                                {(constraint?.minDurationPerPhase !== undefined || constraint?.maxDurationPerPhase !== undefined) && (
                                    <small className="text-500 block mt-1">
                                        Limit: {constraint.minDurationPerPhase ?? 0} - {constraint.maxDurationPerPhase ?? '∞'} days
                                    </small>
                                )}
                            </div>

                            <div className="field col-12">
                                <label className="font-bold text-sm">Description of Activities</label>
                                <InputTextarea
                                    value={phase.description || ''}
                                    onChange={(e) => updatePhase(index, 'description', e.target.value)}
                                    rows={2}
                                    autoResize
                                    className={classNames({
                                        'p-invalid': submitted && !phase.description?.trim()
                                    })}
                                />
                                {submitted && !phase.description?.trim() && (
                                    <small className="p-error block">Description is required.</small>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            <Button
                label={isMaxReached ? "Phase Limit Reached" : "Add New Project Phase"}
                icon="pi pi-plus"
                className="p-button-outlined p-button-sm w-full border-dashed py-3"
                onClick={addPhase}
                disabled={isMaxReached}
                tooltip={isMaxReached ? `Maximum of ${constraint?.maxPhases} phases allowed` : ""}
                tooltipOptions={{ showOnDisabled: true }}
            />

            {/* Navigation */}
            <div className="flex justify-content-between mt-6 pt-4 border-top-1 surface-border">
                <Button label="Back to Info" icon="pi pi-chevron-left" onClick={onBack} className="p-button-text p-button-secondary" />
                <Button label="Next: Collaborators" icon="pi pi-chevron-right" iconPos="right" onClick={validateAndNext} className="px-5" />
            </div>
        </div>
    );
};