'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { Project } from '../../models/project.model';
import { Constraint } from '@/app/(main)/constraints/models/constraint.model';
import { etbCurrencyFormatter, extractId } from "@/utils/utils";
import { MultiSelect } from 'primereact/multiselect';
import { UserApi } from '@/app/(main)/users/api/user.api';
import { User } from '@/app/(main)/users/models/user.model';

interface PhasesStepProps {
    data: Partial<Project>;
    constraint?: Constraint;
    onUpdate: (data: Partial<Project>) => void;
    onNext: () => void;
    onBack: () => void;
    nextLabel?: string;
    backLabel?: string;
}

export const PhasesStep = ({ data, constraint, onUpdate, onNext, onBack, nextLabel, backLabel }: PhasesStepProps) => {
    const [submitted, setSubmitted] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const componentBased = typeof data.call === 'object' && !!data.call?.componentBased;

    useEffect(() => {
        if (!componentBased) return;
        const loadUsers = async () => {
            try {
                const availableUsers = await UserApi.lookup!();
                setUsers(availableUsers || []);
            } catch (error) {
                console.error('Failed to load component contributor choices:', error);
            }
        };
        loadUsers();
    }, [componentBased]);

    // --- Validation Logic ---
    const validation = useMemo(() => {
        const phases = data.phases || [];
        const leadId = extractId(data.leadPI);
        const collaboratorIds = new Set(
            (data.collaborators || [])
                .filter(collaborator => !collaborator.isLeadPI)
                .map(collaborator => extractId(collaborator.member))
                .filter((id): id is string => !!id && id !== leadId)
        );
        const totalBudget = phases.reduce((acc, curr) => acc + (curr.budget || 0), 0);
        const totalDuration = phases.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        const projectComponents = data.components || [];
        const componentsValid = !componentBased || (
            projectComponents.length > 0 &&
            projectComponents.every(component =>
                !!component.title?.trim() &&
                !!component.contributors?.length &&
                component.contributors.every(contributor => {
                    const id = extractId(contributor);
                    return !!id && collaboratorIds.has(id);
                })
            )
        );

        // Check Phase Count
        const isCountValid =
            phases.length >= (constraint?.phases?.min ?? 0) &&
            phases.length <= (constraint?.phases?.max ?? Infinity);

        // Check Aggregates
        const isTotalBudgetValid =
            totalBudget >= (constraint?.budget?.min ?? 0) &&
            totalBudget <= (constraint?.budget?.max ?? Infinity);

        const isTotalTimeValid =
            totalDuration >= (constraint?.duration?.min ?? 0) &&
            totalDuration <= (constraint?.duration?.max ?? Infinity);

        // Check Individual Phases (Removed description requirement)
        const phaseErrors = phases.map(p => {
            const budgetErr =
                p.budget < (constraint?.budgetPerPhase?.min ?? 0) ||
                p.budget > (constraint?.budgetPerPhase?.max ?? Infinity);

            const timeErr =
                p.duration < (constraint?.durationPerPhase?.min ?? 0) ||
                p.duration > (constraint?.durationPerPhase?.max ?? Infinity);

            const basicErr = !p.title?.trim(); // Only checking title now
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
            componentsValid,
            isValid: isCountValid && isTotalBudgetValid && isTotalTimeValid && allPhasesValid && componentsValid
        };
    }, [data.phases, data.components, data.collaborators, data.leadPI, constraint, componentBased]);

    const maxPhases = constraint?.phases?.max;
    const isMaxReached = !!(maxPhases && validation.currentCount >= maxPhases);

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
        newPhases.push({
            title: '',
            order: newPhases.length + 1,
            budget: 0,
            duration: 0,
            description: ''
        });
        onUpdate({ ...data, phases: newPhases });
    };

    const removePhase = (index: number) => {
        const newPhases = data.phases?.filter((_, i) => i !== index).map((p, idx) => ({ ...p, order: idx + 1 }));
        onUpdate({ ...data, phases: newPhases });
    };

    const updateComponents = (components: NonNullable<Project['components']>) => {
        onUpdate({ ...data, components });
    };

    const contributorOptions = useMemo(() => {
        const collaborators = data.collaborators || [];
        const memberIds = new Set(
            collaborators
                .filter(collaborator => !collaborator.isLeadPI)
                .map(collaborator => extractId(collaborator.member))
                .filter((id): id is string => !!id)
        );
        const leadId = extractId(data.leadPI);
        return users
            .filter(
                (user): user is User & { _id: string } =>
                    !!user._id && memberIds.has(user._id) && user._id !== leadId
            )
            .map(user => ({ label: user.name || user._id, value: user._id }));
    }, [users, data.collaborators, data.leadPI]);

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
                        Phases allowed: {constraint?.phases?.min ?? 1} - {constraint?.phases?.max ?? '∞'}
                    </p>
                </div>
                <div className="flex gap-4 mt-3 md:mt-0">
                    <div className="text-right">
                        <small className="block text-700 uppercase font-bold text-xs">Total Duration</small>
                        <span className={classNames("text-xl font-bold", validation.isTotalTimeValid ? "text-900" : "text-red-600")}>
                            {validation.totalDuration} / {constraint?.duration?.max ?? '∞'} Days
                        </span>
                    </div>
                    <div className="text-right">
                        <small className="block text-700 uppercase font-bold text-xs">Total Budget</small>
                        <span className={classNames("text-xl font-bold", validation.isTotalBudgetValid ? "text-primary" : "text-red-600")}>
                            {etbCurrencyFormatter.format(validation.totalBudget)}
                        </span>
                        {constraint?.budget?.max !== undefined && (
                            <small className="block text-500">Max: {etbCurrencyFormatter.format(constraint.budget.max)}</small>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Messages for Totals */}
            {submitted && !validation.isTotalBudgetValid && (
                <Message
                    severity="error"
                    text={`Total budget must be between ${etbCurrencyFormatter.format(constraint?.budget?.min ?? 0)} and ${constraint?.budget?.max !== undefined ? etbCurrencyFormatter.format(constraint.budget.max) : 'unlimited'
                        }`}
                    className="w-full mb-3"
                />
            )}
            {submitted && !validation.isTotalTimeValid && (
                <Message
                    severity="error"
                    text={`Total duration must be between ${constraint?.duration?.min ?? 0} and ${constraint?.duration?.max ?? '∞'} days.`}
                    className="w-full mb-3"
                />
            )}

            {componentBased && (
                <div className="mb-4 p-3 surface-card border-1 border-200 border-round">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <div>
                            <h4 className="m-0 text-900">Project Components *</h4>
                            <small className="text-600">
                                Components are created once for the project, can be reused in any phase, and are assigned to non-PI collaborators.
                            </small>
                        </div>
                        <Button
                            type="button"
                            label="Add Component"
                            icon="pi pi-plus"
                            className="p-button-sm p-button-outlined"
                            onClick={() => updateComponents([
                                ...(data.components || []),
                                { title: "", contributors: [] }
                            ])}
                        />
                    </div>
                    {(data.components || []).map((component, componentIndex) => (
                        <div key={componentIndex} className="grid align-items-end mb-2 p-2 surface-50 border-round">
                            <div className="field col-12 md:col-5 mb-0">
                                <label className="font-semibold text-sm">Component name *</label>
                                <InputText
                                    value={component.title || ""}
                                    onChange={event => {
                                        const components = [...(data.components || [])];
                                        components[componentIndex] = {
                                            ...components[componentIndex],
                                            title: event.target.value
                                        };
                                        updateComponents(components);
                                    }}
                                    placeholder="e.g., Data collection"
                                    className={classNames({
                                        "p-invalid": submitted && !component.title?.trim()
                                    })}
                                />
                            </div>
                            <div className="field col-12 md:col-6 mb-0">
                                <label className="font-semibold text-sm">Contributors *</label>
                                <MultiSelect
                                    value={component.contributors?.map(contributor => extractId(contributor)).filter(Boolean)}
                                    options={contributorOptions}
                                    onChange={event => {
                                        const components = [...(data.components || [])];
                                        components[componentIndex] = {
                                            ...components[componentIndex],
                                            contributors: event.value || []
                                        };
                                        updateComponents(components);
                                    }}
                                    placeholder="Select project collaborators"
                                    display="chip"
                                    className={classNames({
                                        "p-invalid": submitted && !component.contributors?.length
                                    })}
                                />
                            </div>
                            <div className="col-12 md:col-1 flex justify-content-end">
                                <Button
                                    type="button"
                                    icon="pi pi-trash"
                                    className="p-button-rounded p-button-text p-button-danger"
                                    aria-label="Remove component"
                                    onClick={() => updateComponents(
                                        (data.components || []).filter((_, i) => i !== componentIndex)
                                    )}
                                />
                            </div>
                        </div>
                    ))}
                    {submitted && !data.components?.length && (
                        <small className="p-error">Add at least one project component.</small>
                    )}
                    {submitted && !validation.componentsValid && !!data.components?.length && (
                        <small className="p-error block">
                            Every component needs a name and at least one current non-PI project collaborator.
                        </small>
                    )}
                    {!contributorOptions.length && (
                        <small className="p-error block mt-2">Add non-PI collaborators in the team step before assigning components.</small>
                    )}
                </div>
            )}

            {/* Phase List */}
            {data.phases?.map((phase, index) => {
                const isPhaseBudgetInvalid =
                    submitted &&
                    ((constraint?.budgetPerPhase?.min !== undefined && phase.budget < constraint.budgetPerPhase.min) ||
                        (constraint?.budgetPerPhase?.max !== undefined && phase.budget > constraint.budgetPerPhase.max));

                const isPhaseDurationInvalid =
                    submitted &&
                    ((constraint?.durationPerPhase?.min !== undefined && phase.duration < constraint.durationPerPhase.min) ||
                        (constraint?.durationPerPhase?.max !== undefined && phase.duration > constraint.durationPerPhase.max));

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
                                        ][phase.order??1 - 1] || "e.g., Phase Title"
                                    }
                                    className={classNames({ 'p-invalid': submitted && !phase.title?.trim() })}
                                />
                            </div>

                            <div className="field col-12 md:col-3">
                                <label className="font-bold text-sm">Budget (ETB)</label>
                                <InputNumber
                                    value={phase.budget}
                                    onValueChange={(e) => updatePhase(index, 'budget', e.value ?? 0)}
                                    mode="currency"
                                    currency="ETB"
                                    locale="en-US"
                                    className={classNames({ 'p-invalid': isPhaseBudgetInvalid })}
                                />
                                {(constraint?.budgetPerPhase?.min !== undefined || constraint?.budgetPerPhase?.max !== undefined) && (
                                    <small className="text-500 block mt-1">
                                        Limit: {etbCurrencyFormatter.format(constraint?.budgetPerPhase?.min ?? 0)} - {constraint?.budgetPerPhase?.max !== undefined ? etbCurrencyFormatter.format(constraint.budgetPerPhase.max) : '∞'}
                                    </small>
                                )}
                            </div>

                            <div className="field col-12 md:col-3">
                                <label className="font-bold text-sm">Duration (Days)</label>
                                <InputNumber
                                    value={phase.duration}
                                    onValueChange={(e) => updatePhase(index, 'duration', e.value ?? 0)}
                                    suffix=" Days"
                                    showButtons
                                    min={0}
                                    className={classNames({ 'p-invalid': isPhaseDurationInvalid })}
                                />
                                {(constraint?.durationPerPhase?.min !== undefined || constraint?.durationPerPhase?.max !== undefined) && (
                                    <small className="text-500 block mt-1">
                                        Limit: {constraint?.durationPerPhase?.min ?? 0} - {constraint?.durationPerPhase?.max ?? '∞'} days
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
                                />
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
                tooltip={isMaxReached ? `Maximum of ${maxPhases} phases allowed` : ""}
                tooltipOptions={{ showOnDisabled: true }}
            />

            {/* Navigation */}
            <div className="flex justify-content-between mt-6 pt-4 border-top-1 surface-border">
                <Button label={backLabel || "Back to Info"} icon="pi pi-chevron-left" onClick={onBack} className="p-button-text p-button-secondary" />
                <Button label={nextLabel || "Next: Collaborators"} icon="pi pi-chevron-right" iconPos="right" onClick={validateAndNext} className="px-5" />
            </div>
        </div>
    );
};