'use client';
import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Project } from '../../models/project.model';

interface PhasesStepProps {
    data: Partial<Project>;
    onUpdate: (data: Partial<Project>) => void;
    onNext: () => void;
    onBack: () => void;
}

export const PhasesStep = ({ data, onUpdate, onNext, onBack }: PhasesStepProps) => {

    const addPhase = () => {
        const newPhases = [...(data.phases || [])];
        newPhases.push({
            title: '',
            order: newPhases.length + 1,
            budget: 1000,
            duration: 10, // Added duration
            description: ''
        });
        onUpdate({ ...data, phases: newPhases });
    };

    const removePhase = (index: number) => {
        const newPhases = data.phases?.filter((_, i) => i !== index);
        const reorderedPhases = newPhases?.map((phase, idx) => ({ ...phase, order: idx + 1 }));
        onUpdate({ ...data, phases: reorderedPhases });
    };

    const updatePhase = (index: number, field: string, value: any) => {
        const newPhases = [...(data.phases || [])];
        newPhases[index] = { ...newPhases[index], [field]: value };

        // Calculate totals dynamically
        const newTotalBudget = newPhases.reduce((acc, curr) => acc + (curr.budget || 0), 0);
        const newTotalDuration = newPhases.reduce((acc, curr) => acc + (curr.duration || 0), 0);

        onUpdate({
            ...data,
            phases: newPhases,
            totalBudget: newTotalBudget,
            totalDuration: newTotalDuration // Assuming your model tracks total duration
        });
    };

    const validateAndNext = () => {
        // Ensure every phase has a title, positive budget, and positive duration
        const isValid = data.phases?.length && data.phases?.every(phase =>
            phase.title.trim() !== '' && phase.budget > 0 && phase.duration > 0
        );

        if (isValid) {
            onNext();
        } else {
            // You could integrate a Toast here to say "Please fill all phase details"
            alert("Please ensure all phases have a title, budget, and duration.");
        }
    };

    return (
        <div className="mt-4">
            {/* Summary Header */}
            <div className="flex flex-column md:flex-row justify-content-between align-items-center mb-4 p-3 bg-blue-50 border-round-xl border-1 border-blue-100">
                <div>
                    <h4 className="m-0 text-900">Project Budget & Timeline</h4>
                    <p className="text-600 text-sm m-0">Define your project milestones, costs, and time per phase.</p>
                </div>
                <div className="flex gap-4 mt-3 md:mt-0">
                    <div className="text-right">
                        <small className="block text-700 uppercase font-bold text-xs">Total Duration</small>
                        <span className="text-xl font-bold text-900">{(data as any).totalDuration || 0} Days</span>
                    </div>
                    <div className="text-right">
                        <small className="block text-700 uppercase font-bold text-xs">Total Budget</small>
                        <span className="text-xl font-bold text-primary">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(data.totalBudget || 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Phase List */}
            {data.phases?.map((phase, index) => (
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
                            disabled={data.phases!.length <= 1}
                            tooltip="Remove Phase"
                        />
                    </div>

                    <div className="p-fluid grid">
                        <div className="field col-12 md:col-6">
                            <label className="font-bold text-sm">Phase Title</label>
                            <InputText
                                value={phase.title}
                                onChange={(e) => updatePhase(index, 'title', e.target.value)}
                                placeholder={
                                    [
                                        "e.g., Preliminary Research",
                                        "e.g., Design & Planning",
                                        "e.g., Implementation"
                                    ][phase.order - 1] || "e.g., Phase Title"
                                }
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label className="font-bold text-sm">Budget ($)</label>
                            <InputNumber
                                value={phase.budget}
                                onValueChange={(e) => updatePhase(index, 'budget', e.value)}
                                mode="currency"
                                currency="ETB"
                                locale="en-US"
                            />
                        </div>
                        <div className="field col-12 md:col-3">
                            <label className="font-bold text-sm">Duration (Days)</label>
                            <InputNumber
                                value={phase.duration}
                                onValueChange={(e) => updatePhase(index, 'duration', e.value)}
                                suffix=" Days"
                                showButtons
                                min={1}
                            />
                        </div>
                        <div className="field col-12">
                            <label className="font-bold text-sm">Description of Activities</label>
                            <InputTextarea
                                value={phase.description}
                                onChange={(e) => updatePhase(index, 'description', e.target.value)}
                                rows={2}
                                autoResize
                                placeholder="What will be achieved during this phase?"
                            />
                        </div>
                    </div>
                </div>
            ))}

            <Button
                label="Add New Project Phase"
                icon="pi pi-plus"
                className="p-button-outlined p-button-sm w-full border-dashed py-3"
                onClick={addPhase}
            />

            {/* Navigation */}
            <div className="flex justify-content-between mt-6 pt-4 border-top-1 surface-border">
                <Button
                    label="Back to Info"
                    icon="pi pi-chevron-left"
                    onClick={onBack}
                    className="p-button-text p-button-secondary"
                />
                <Button
                    label="Next: Collaborators"
                    icon="pi pi-chevron-right"
                    iconPos="right"
                    onClick={validateAndNext}
                    className="px-5"
                />
            </div>
        </div>
    );
};