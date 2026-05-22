'use client';
import { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { Composition, OperationMode, TargetScope } from '../models/composition.model';
import { CompositionApi } from '../api/composition.api';
import { validateComposition } from '../models/composition.model';
import { genderOptions } from '@/app/(main)/users/models/user.model';
import { AcademicLevel } from "@/app/(main)/organizations/models/organization.model";
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveComposition = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<Composition>) => {

    const toast = useRef<Toast>(null);
    const [localComposition, setLocalComposition] = useState<Composition>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalComposition({ ...item });
    }, [item]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalComposition({ ...item });
    };

    const save = async () => {
        setSubmitted(true);
        try {
            const validation = validateComposition(localComposition);
            if (!validation.valid) throw new Error(validation.message);

            const saved = localComposition._id
                ? await CompositionApi.update(localComposition)
                : await CompositionApi.create(localComposition);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Composition saved successfully',
                life: 2000
            });

            if (onComplete) setTimeout(() => onComplete(saved), 800);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save composition',
                life: 2500
            });
        }
    };

    const hide = () => {
        clearForm();
        onHide();
    };

    // Auto-clear mode and thresholds if targetScope changes away from TEAM_AGGREGATE
    const handleScopeChange = (scopeValue: TargetScope) => {
        const updated = { ...localComposition, targetScope: scopeValue };

        if (scopeValue !== TargetScope.TEAM_AGGREGATE) {
            delete updated.mode;
            delete updated.threshold;
        }

        setLocalComposition(updated);
    };

    const footer = (
        <>
            <Button label="Cancel" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" onClick={save} />
        </>
    );

    const opModeOptions = Object.values(OperationMode).map(opm => ({ label: opm, value: opm }));
    const targetScopeOptions = Object.values(TargetScope).map(ts => ({ label: ts.replace('_', ' '), value: ts }));
    const academicLevelOptions = Object.values(AcademicLevel).map(al => ({ label: al, value: al }));

    const isAggregateScope = localComposition.targetScope === TargetScope.TEAM_AGGREGATE;

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '750px' }}
                maximizable
                header={localComposition._id ? 'Edit Composition Rule' : 'New Composition Rule'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                <Accordion multiple activeIndex={[0]}>

                    {/* 🔹 Basic Information */}
                    <AccordionTab header="Basic Information">
                        <div className="field">
                            <label htmlFor="description">Description / Rule Title</label>
                            <InputText
                                id="description"
                                value={localComposition.description || ''}
                                onChange={(e) => setLocalComposition({ ...localComposition, description: e.target.value })}
                                className={classNames({ 'p-invalid': submitted && !localComposition.description })}
                                placeholder="e.g., Target threshold for Ph.D. holders or submission limit"
                            />
                        </div>

                        <div className="formgrid grid">
                            <div className={classNames("field col", { "col-12": !isAggregateScope, "col-6": isAggregateScope })}>
                                <label htmlFor="targetScope">Target Scope</label>
                                <Dropdown
                                    id="targetScope"
                                    value={localComposition.targetScope}
                                    options={targetScopeOptions}
                                    onChange={(e) => handleScopeChange(e.value)}
                                    placeholder="Select Scope"
                                    className={classNames({ 'p-invalid': submitted && !localComposition.targetScope })}
                                    disabled={!!localComposition._id}
                                />
                            </div>

                            {/* 🎯 Mode selection is only visible for Aggregate Scope */}
                            {isAggregateScope && (
                                <div className="field col-6">
                                    <label htmlFor="mode">Evaluation Mode</label>
                                    <Dropdown
                                        id="mode"
                                        value={localComposition.mode}
                                        options={opModeOptions}
                                        onChange={(e) => setLocalComposition({ ...localComposition, mode: e.value })}
                                        placeholder="Select Mode"
                                        className={classNames({ 'p-invalid': submitted && !localComposition.mode })}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 🎯 Min/Max Threshold targets are only visible for Aggregate Scope when a mode is picked */}
                        {isAggregateScope && localComposition.mode && (
                            <div className="formgrid grid border-1 surface-border border-round p-3 mt-2 surface-card">
                                <div className="col-12 font-semibold mb-2" style={{ fontSize: '0.9rem' }}>
                                    Aggregate Bound Targets ({localComposition.mode})
                                </div>
                                <div className="field col-6">
                                    <label>Min Target Boundary</label>
                                    <InputNumber
                                        value={localComposition.threshold?.min}
                                        onValueChange={(e) => setLocalComposition({
                                            ...localComposition,
                                            threshold: { min: e.value ?? 0, max: localComposition.threshold?.max ?? Infinity }
                                        })}
                                        placeholder={localComposition.mode === OperationMode.RATIO ? "e.g., 0.40" : "e.g., 2"}
                                        min={0}
                                        max={localComposition.mode === OperationMode.RATIO ? 1 : undefined}
                                        maxFractionDigits={localComposition.mode === OperationMode.RATIO ? 2 : 0}
                                    />
                                </div>
                                <div className="field col-6">
                                    <label>Max Target Boundary</label>
                                    <InputNumber
                                        value={localComposition.threshold?.max === Infinity ? null : localComposition.threshold?.max}
                                        onValueChange={(e) => setLocalComposition({
                                            ...localComposition,
                                            threshold: { min: localComposition.threshold?.min ?? 0, max: e.value ?? Infinity }
                                        })}
                                        placeholder="Leave blank for Infinity (No Upper Limit)"
                                        min={0}
                                        max={localComposition.mode === OperationMode.RATIO ? 1 : undefined}
                                        maxFractionDigits={localComposition.mode === OperationMode.RATIO ? 2 : 0}
                                    />
                                </div>
                            </div>
                        )}
                    </AccordionTab>

                    {/* 🔹 Profile Demographic Rules */}
                    <AccordionTab header="Profile Criteria Filters">
                        <div className="field">
                            <label htmlFor="gender">Gender Target</label>
                            <Dropdown
                                id="gender"
                                value={localComposition.profileRule?.gender}
                                options={genderOptions}
                                onChange={(e) => setLocalComposition({
                                    ...localComposition,
                                    profileRule: { ...localComposition.profileRule, gender: e.value }
                                })}
                                placeholder="Select Gender Target"
                                showClear
                            />
                        </div>

                        <div className="grid mt-2">
                            <div className="col-6">
                                <label className="font-medium">Min Age</label>
                                <InputNumber
                                    value={localComposition.profileRule?.age?.min}
                                    onValueChange={(e) => setLocalComposition({
                                        ...localComposition,
                                        profileRule: {
                                            ...localComposition.profileRule,
                                            age: { min: e.value ?? 0, max: localComposition.profileRule?.age?.max ?? 120 }
                                        }
                                    })}
                                    min={0}
                                />
                            </div>
                            <div className="col-6">
                                <label className="font-medium">Max Age</label>
                                <InputNumber
                                    value={localComposition.profileRule?.age?.max}
                                    onValueChange={(e) => setLocalComposition({
                                        ...localComposition,
                                        profileRule: {
                                            ...localComposition.profileRule,
                                            age: { min: localComposition.profileRule?.age?.min ?? 0, max: e.value ?? 120 }
                                        }
                                    })}
                                    min={0}
                                />
                            </div>
                        </div>

                        <div className="grid mt-3">
                            <div className="col-6">
                                <label className="font-medium">Min Experience (Years)</label>
                                <InputNumber
                                    value={localComposition.profileRule?.experienceYears?.min}
                                    onValueChange={(e) => setLocalComposition({
                                        ...localComposition,
                                        profileRule: {
                                            ...localComposition.profileRule,
                                            experienceYears: { min: e.value ?? 0, max: localComposition.profileRule?.experienceYears?.max ?? 50 }
                                        }
                                    })}
                                    min={0}
                                />
                            </div>
                            <div className="col-6">
                                <label className="font-medium">Max Experience (Years)</label>
                                <InputNumber
                                    value={localComposition.profileRule?.experienceYears?.max}
                                    onValueChange={(e) => setLocalComposition({
                                        ...localComposition,
                                        profileRule: {
                                            ...localComposition.profileRule,
                                            experienceYears: { min: localComposition.profileRule?.experienceYears?.min ?? 0, max: e.value ?? 50 }
                                        }
                                    })}
                                    min={0}
                                />
                            </div>
                        </div>

                        <div className="field mt-3">
                            <label>Academic Levels Required</label>
                            <MultiSelect
                                value={localComposition.profileRule?.academicLevels || []}
                                options={academicLevelOptions}
                                onChange={(e) => setLocalComposition({
                                    ...localComposition,
                                    profileRule: { ...localComposition.profileRule, academicLevels: e.value }
                                })}
                                placeholder="Select Academic Levels"
                                display="chip"
                            />
                        </div>
                    </AccordionTab>

                    {/* 🔹 Project History Enforcement Rules */}
                    <AccordionTab header="Project Performance & History Restrictions">
                        <div className="grid">
                            <div className="field col-6">
                                <label>Min Submissions</label>
                                <InputNumber
                                    value={localComposition.projectHistoryRule?.submission?.min}
                                    onValueChange={(e) => setLocalComposition({
                                        ...localComposition,
                                        projectHistoryRule: {
                                            ...localComposition.projectHistoryRule,
                                            submission: { min: e.value ?? 0, max: localComposition.projectHistoryRule?.submission?.max ?? Infinity }
                                        }
                                    })}
                                    min={0}
                                />
                            </div>
                            <div className="field col-6">
                                <label>Max Submissions</label>
                                <InputNumber
                                    value={localComposition.projectHistoryRule?.submission?.max === Infinity ? null : localComposition.projectHistoryRule?.submission?.max}
                                    onValueChange={(e) => setLocalComposition({
                                        ...localComposition,
                                        projectHistoryRule: {
                                            ...localComposition.projectHistoryRule,
                                            submission: { min: localComposition.projectHistoryRule?.submission?.min ?? 0, max: e.value ?? Infinity }
                                        }
                                    })}
                                    min={0}
                                    placeholder="Infinity"
                                />
                            </div>
                        </div>

                        <div className="grid mt-2">
                            <div className="field col-6">
                                <label>Min Completions Required</label>
                                <InputNumber
                                    value={localComposition.projectHistoryRule?.completion?.min}
                                    onValueChange={(e) => setLocalComposition({
                                        ...localComposition,
                                        projectHistoryRule: {
                                            ...localComposition.projectHistoryRule,
                                            completion: { min: e.value ?? 0, max: localComposition.projectHistoryRule?.completion?.max ?? Infinity }
                                        }
                                    })}
                                    min={0}
                                />
                            </div>
                            <div className="field col-6">
                                <label>Max Rejections Threshold</label>
                                <InputNumber
                                    value={localComposition.projectHistoryRule?.rejection?.max === Infinity ? null : localComposition.projectHistoryRule?.rejection?.max}
                                    onValueChange={(e) => setLocalComposition({
                                        ...localComposition,
                                        projectHistoryRule: {
                                            ...localComposition.projectHistoryRule,
                                            rejection: { min: localComposition.projectHistoryRule?.rejection?.min ?? 0, max: e.value ?? Infinity }
                                        }
                                    })}
                                    min={0}
                                    placeholder="No Ceiling Limit"
                                />
                            </div>
                        </div>
                    </AccordionTab>
                </Accordion>
            </Dialog>
        </>
    );
};

export default SaveComposition;