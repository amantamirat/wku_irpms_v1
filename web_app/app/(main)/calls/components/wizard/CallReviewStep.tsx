'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Stage } from '../../stages/models/stage.model';
import { Call } from '../../models/call.model';

interface CallReviewStepProps {
    callData: Partial<Call>;
    stages: Partial<Stage>[];
    onSave: () => void;
    onBack: () => void;
    saving: boolean;
}

export const CallReviewStep = ({ callData, stages, onSave, onBack, saving }: CallReviewStepProps) => {
    return (
        <div className="mt-4">
            <h4 className="text-900 mb-3">Review Call Configuration</h4>

            <div className="surface-card border-1 border-200 border-round p-4 mb-4">
                <h5 className="text-700 border-bottom-1 surface-border pb-2 mb-3">General Information</h5>
                <div className="grid">
                    <div className="col-12 md:col-6 mb-2">
                        <span className="text-500 block text-xs uppercase font-bold">Call Title</span>
                        <span className="text-900 font-medium">{callData.title}</span>
                    </div>
                    <div className="col-12 md:col-6 mb-2">
                        <span className="text-500 block text-xs uppercase font-bold">Operational Year</span>
                        <span className="text-900 font-medium">{(callData.calendar as any)?.year || 'Selected'}</span>
                    </div>
                    <div className="col-12 md:col-6 mb-2">
                        <span className="text-500 block text-xs uppercase font-bold">Grant</span>
                        <span className="text-900 font-medium">{(callData.grant as any)?.title || 'Selected'}</span>
                    </div>
                    <div className="col-12 col-12 mb-2">
                        <span className="text-500 block text-xs uppercase font-bold">Description</span>
                        <p className="text-800 m-0 text-sm">{callData.description || 'No description provided.'}</p>
                    </div>
                </div>
            </div>

            <div className="surface-card border-1 border-200 border-round p-4 mb-4">
                <h5 className="text-700 border-bottom-1 surface-border pb-2 mb-3">Configured Stages ({stages.length})</h5>
                {stages.map((stage, idx) => (
                    <div key={idx} className="flex justify-content-between align-items-center py-2 border-bottom-1 surface-100 mb-2 px-2 border-round">
                        <div>
                            <span className="font-bold text-900 mr-2">{idx + 1}. {stage.name}</span>
                            <span className="text-500 text-xs">Min Score: {stage.minAcceptanceScore}%</span>
                        </div>
                        <span className="text-sm text-700">
                            Deadline: {stage.deadline ? new Date(stage.deadline).toLocaleString() : 'N/A'}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex justify-content-between mt-5 pt-3 border-top-1 surface-border">
                <Button label="Back" icon="pi pi-chevron-left" onClick={onBack} className="p-button-text p-button-secondary" disabled={saving} />
                <Button label="Create Call & Stages" icon="pi pi-check" onClick={onSave} loading={saving} severity="success" className="px-5" />
            </div>
        </div>
    );
};