'use client';

import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { classNames } from 'primereact/utils';

// Models & APIs
import { Stage } from '../../stages/models/stage.model';
import { Evaluation } from '@/app/(main)/evaluations/models/evaluation.model';
import { Template } from '@/app/(main)/templates/models/template.model';
import { EvaluationApi } from '@/app/(main)/evaluations/api/evaluation.api';
import { EvaluationStatus } from '@/app/(main)/evaluations/models/evaluation.state-machine';
import { TemplateApi } from '@/app/(main)/templates/api/template.api';


interface CallStagesStepProps {
    stages: Partial<Stage>[];
    onUpdateStages: (stages: Partial<Stage>[]) => void;
    onNext: () => void;
    onBack: () => void;
}

const STAGE_PRESETS = [
    { label: 'Concept Note', value: 'Concept Note' },
    { label: 'Proposal', value: 'Proposal' },
    { label: 'Manuscript', value: 'Manuscript' },
    { label: 'Eligibility Screening', value: 'Eligibility Screening' },
    { label: 'Peer Review', value: 'Peer Review' },
    { label: 'Verification & Audit', value: 'Verification & Audit' },
    { label: 'Final Selection', value: 'Final Selection' }
];

export const CallStagesStep = ({ stages, onUpdateStages, onNext, onBack }: CallStagesStepProps) => {
    const [submitted, setSubmitted] = useState(false);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);

    useEffect(() => {
        EvaluationApi.getAll({ status: EvaluationStatus.published }).then(setEvaluations).catch(console.error);
        TemplateApi.getAll().then(setTemplates).catch(console.error);
    }, []);

    const addStage = () => {
        const nextOrder = stages.length + 1;
        onUpdateStages([
            ...stages,
            { name: '', order: nextOrder, minAcceptanceScore: 50, deadline: undefined }
        ]);
    };

    const removeStage = (index: number) => {
        const updated = stages.filter((_, i) => i !== index).map((s, idx) => ({ ...s, order: idx + 1 }));
        onUpdateStages(updated);
    };

    const updateStageField = (index: number, field: keyof Stage, value: any) => {
        const updated = [...stages];
        updated[index] = { ...updated[index], [field]: value };
        onUpdateStages(updated);
    };

    const isStageValid = (stage: Partial<Stage>) => {
        return !!stage.name?.trim() && !!stage.deadline;
    };

    const validateAndNext = () => {
        setSubmitted(true);
        if (stages.length > 0 && stages.every(isStageValid)) {
            onNext();
        }
    };

    return (
        <div className="mt-4">
            <div className="flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="m-0 text-900">Call Evaluation Stages</h4>
                    <p className="text-600 text-sm m-0">Define lifecycle stages, deadlines, and evaluation forms for this call.</p>
                </div>
                <Button label="Add Stage" icon="pi pi-plus" className="p-button-outlined p-button-sm" onClick={addStage} />
            </div>

            {submitted && stages.length === 0 && (
                <div className="p-message p-message-error mb-4">At least one stage must be defined for this call.</div>
            )}

            {stages.map((stage, index) => {
                const maxScore = (stage.evaluation as Evaluation)?.weight ?? 100;

                return (
                    <div key={index} className="card border-1 border-200 surface-50 mb-4 p-3 relative shadow-1 border-round-lg">
                        <div className="flex align-items-center mb-3">
                            <span className="border-circle bg-primary text-white w-2rem h-2rem flex align-items-center justify-content-center font-bold mr-2">
                                {index + 1}
                            </span>
                            <h5 className="m-0 text-700">Stage #{index + 1}</h5>
                            <Button
                                icon="pi pi-trash"
                                className="p-button-rounded p-button-danger p-button-text ml-auto"
                                onClick={() => removeStage(index)}
                                disabled={stages.length <= 1}
                            />
                        </div>

                        <div className="p-fluid grid">
                            {/* Stage Name */}
                            <div className="field col-12 md:col-6">
                                <label className="font-bold text-sm">Stage Name *</label>
                                <Dropdown
                                    value={stage.name || ''}
                                    options={STAGE_PRESETS}
                                    onChange={(e) => updateStageField(index, 'name', e.value)}
                                    editable
                                    placeholder="Select or type custom name"
                                    className={classNames({ 'p-invalid': submitted && !stage.name?.trim() })}
                                />
                                {submitted && !stage.name?.trim() && <small className="p-error">Stage Name required.</small>}
                            </div>

                            {/* Deadline */}
                            <div className="field col-12 md:col-6">
                                <label className="font-bold text-sm">Submission Deadline *</label>
                                <Calendar
                                    value={stage.deadline ? new Date(stage.deadline) : null}
                                    onChange={(e) => updateStageField(index, 'deadline', e.value)}
                                    showIcon
                                    showTime
                                    hourFormat="24"
                                    placeholder="Select deadline"
                                    className={classNames({ 'p-invalid': submitted && !stage.deadline })}
                                />
                                {submitted && !stage.deadline && <small className="p-error">Deadline required.</small>}
                            </div>

                            {/* Evaluation Form */}
                            <div className="field col-12 md:col-4">
                                <label className="font-semibold text-sm">Evaluation Form</label>
                                <Dropdown
                                    value={stage.evaluation}
                                    options={evaluations}
                                    optionLabel="title"
                                    dataKey="_id"
                                    onChange={(e) => updateStageField(index, 'evaluation', e.value)}
                                    placeholder="Select Form (Optional)"
                                    showClear
                                />
                            </div>

                            {/* Min Acceptance Score */}
                            <div className="field col-12 md:col-4">
                                <label className="font-semibold text-sm">Min Score to Pass</label>
                                <InputNumber
                                    value={stage.minAcceptanceScore ?? 50}
                                    onValueChange={(e) => updateStageField(index, 'minAcceptanceScore', e.value ?? 0)}
                                    max={maxScore}
                                    min={0}
                                    suffix={` / ${maxScore}`}
                                />
                            </div>

                            {/* Stage Template */}
                            <div className="field col-12 md:col-4">
                                <label className="font-semibold text-sm">Document Template</label>
                                <Dropdown
                                    value={stage.template}
                                    options={templates}
                                    optionLabel="title"
                                    dataKey="_id"
                                    onChange={(e) => updateStageField(index, 'template', e.value)}
                                    placeholder="Select Template (Optional)"
                                    showClear
                                />
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Navigation */}
            <div className="flex justify-content-between mt-5 pt-3 border-top-1 surface-border">
                <Button label="Back" icon="pi pi-chevron-left" onClick={onBack} className="p-button-text p-button-secondary" />
                <Button label="Next: Review & Complete" icon="pi pi-chevron-right" iconPos="right" onClick={validateAndNext} className="px-5" />
            </div>
        </div>
    );
};