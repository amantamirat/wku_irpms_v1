'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { classNames } from 'primereact/utils';

import {
    Composition,
    validateComposition
} from '../models/composition.model';
import { CompositionApi } from '../api/composition.api';
import { ProfileApi } from '../api/profile.api';
import { HistoryApi } from '../api/history.api';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { MemberRequirementApi } from '../api/requirement.api';
import { HistoryRule } from '../models/history.model';
import { EligibilityProfile } from '../models/profile.model';
import { MemberRequirement } from '../models/requirement.model';
import { HistoryContext, HistoryRuleReference } from '../models/history-rule-reference.model';

const contextOptions = Object.values(HistoryContext).map((c) => ({
    label: c,
    value: c
}));

const initializeComposition = (
    item?: Partial<Composition>
): Partial<Composition> => ({
    _id: item?._id,
    name: item?.name ?? '',
    description: item?.description ?? '',
    leadProfileRule: typeof item?.leadProfileRule === 'object' ? item.leadProfileRule?._id : item?.leadProfileRule,
    leadHistoryRules: item?.leadHistoryRules?.map((hr) => ({
        context: hr.context ?? HistoryContext.CALL,
        rule: typeof hr.rule === 'object' ? (hr.rule?._id ?? '') : (hr.rule ?? '')
    })) ?? [],
    memberRequirements: Array.isArray(item?.memberRequirements)
        ? item.memberRequirements.map((mr) => (typeof mr === 'object' ? mr._id : mr)).filter(Boolean) as string[]
        : []
});

const SaveComposition: React.FC<EntitySaveDialogProps<Composition>> = ({
    visible,
    item,
    onComplete,
    onHide
}) => {
    const toast = useRef<Toast>(null);
    
    const [localComposition, setLocalComposition] = useState<Partial<Composition>>(() =>
        initializeComposition(item)
    );
    const [submitted, setSubmitted] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // Referenced lookup options
    const [profiles, setProfiles] = useState<EligibilityProfile[]>([]);
    const [historyRules, setHistoryRules] = useState<HistoryRule[]>([]);
    const [memberRequirements, setMemberRequirements] = useState<MemberRequirement[]>([]);

    // Fetch external profile, history, and requirement rules on mount / dialog open
    useEffect(() => {
        if (!visible) return;

        const fetchOptions = async () => {
            setLoadingOptions(true);
            try {
                const [profilesRes, historyRes, requirementsRes] = await Promise.all([
                    ProfileApi.getAll(),
                    HistoryApi.getAll(),
                    MemberRequirementApi.getAll()
                ]);

                setProfiles(profilesRes || []);
                setHistoryRules(historyRes || []);
                setMemberRequirements(requirementsRes || []);
            } catch (err: any) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error Loading Options',
                    detail: err.message || 'Failed to fetch reference rules.',
                    life: 3000
                });
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchOptions();
    }, [visible]);

    // Sync local state when incoming item changes
    useEffect(() => {
        setLocalComposition(initializeComposition(item));
    }, [item]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalComposition(initializeComposition(item));
    };

    const save = async () => {
        setSubmitted(true);
        try {
            const payload: Partial<Composition> = {
                ...localComposition,
                leadProfileRule: typeof localComposition.leadProfileRule === 'object'
                    ? (localComposition.leadProfileRule as EligibilityProfile)._id
                    : localComposition.leadProfileRule,
                leadHistoryRules: localComposition.leadHistoryRules?.map((hr) => ({
                    context: hr.context,
                    rule: typeof hr.rule === 'object'
                        ? ((hr.rule as HistoryRule)._id ?? '')
                        : (hr.rule ?? '')
                }))
            };

            const validation = validateComposition(payload as Composition);
            if (!validation.valid) throw new Error(validation.message);

            const saved = localComposition._id
                ? await CompositionApi.update(payload)
                : await CompositionApi.create(payload);

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

    // Lead History Rule Reference Handlers
    const addLeadHistoryRuleRef = () => {
        setLocalComposition((prev) => ({
            ...prev,
            leadHistoryRules: [
                ...(prev.leadHistoryRules || []),
                { context: HistoryContext.CALL, rule: '' }
            ]
        }));
    };

    const removeLeadHistoryRuleRef = (index: number) => {
        setLocalComposition((prev) => ({
            ...prev,
            leadHistoryRules: prev.leadHistoryRules?.filter((_, i) => i !== index) ?? []
        }));
    };

    const updateLeadHistoryRuleRef = (
        index: number,
        field: keyof HistoryRuleReference,
        value: any
    ) => {
        setLocalComposition((prev) => {
            const rules = [...(prev.leadHistoryRules || [])];
            rules[index] = {
                ...rules[index],
                [field]: field === 'rule' ? (value ?? '') : value
            };
            return { ...prev, leadHistoryRules: rules };
        });
    };

    // Form dropdown options mapping
    const profileOptions = profiles.map((p) => ({
        label: p.name + (p.description ? ` (${p.description})` : ''),
        value: p._id
    }));

    const historyOptions = historyRules.map((h) => ({
        label: h.name + (h.description ? ` (${h.description})` : ''),
        value: h._id
    }));

    const requirementOptions = memberRequirements.map((r) => ({
        label: `${r.name} [Mode: ${r.mode}]`,
        value: r._id
    }));

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save Composition" icon="pi pi-check" onClick={save} disabled={loadingOptions} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '720px' }}
                header={localComposition._id ? 'Edit Team Composition Rule' : 'Create Team Composition Rule'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {loadingOptions ? (
                    <div className="flex flex-column align-items-center justify-content-center p-5">
                        <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                        <span className="mt-2 text-secondary">Loading criteria options...</span>
                    </div>
                ) : (
                    <Accordion multiple activeIndex={[0, 1, 2]}>
                        {/* Basic Information */}
                        <AccordionTab header="Basic Information">
                            <div className="field">
                                <label htmlFor="name" className="font-semibold">
                                    Composition Name <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="name"
                                    value={localComposition.name || ''}
                                    onChange={(e) => setLocalComposition({ ...localComposition, name: e.target.value })}
                                    className={classNames({ 'p-invalid': submitted && !localComposition.name })}
                                    placeholder="e.g. Standard Multidisciplinary Research Team"
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="description">Description</label>
                                <InputTextarea
                                    id="description"
                                    rows={3}
                                    value={localComposition.description || ''}
                                    onChange={(e) => setLocalComposition({ ...localComposition, description: e.target.value })}
                                    placeholder="Summarize the purpose or bounds of this team structure..."
                                />
                            </div>
                        </AccordionTab>

                        {/* Team Lead Rules */}
                        <AccordionTab header="Team Lead Rules (PI Constraints)">
                            <div className="field mb-3">
                                <label htmlFor="leadProfileRule">Lead Eligibility Profile</label>
                                <Dropdown
                                    id="leadProfileRule"
                                    value={localComposition.leadProfileRule}
                                    options={profileOptions}
                                    onChange={(e) => setLocalComposition({ ...localComposition, leadProfileRule: e.value })}
                                    placeholder="Select Lead Eligibility Profile"
                                    showClear
                                    filter
                                />
                            </div>

                            {/* Lead History Rules Dynamic List */}
                            <div className="surface-border border-1 border-round p-3 surface-card">
                                <div className="flex justify-content-between align-items-center mb-3">
                                    <div className="font-semibold text-900">Lead History Performance References</div>
                                    <Button
                                        label="Add Reference"
                                        icon="pi pi-plus"
                                        size="small"
                                        outlined
                                        onClick={addLeadHistoryRuleRef}
                                    />
                                </div>

                                {(!localComposition.leadHistoryRules || localComposition.leadHistoryRules.length === 0) ? (
                                    <p className="text-sm text-secondary italic m-0">
                                        No lead history performance rules attached. Click "Add Reference" to include history criteria.
                                    </p>
                                ) : (
                                    localComposition.leadHistoryRules.map((hr, index) => (
                                        <div
                                            key={index}
                                            className="formgrid grid align-items-center surface-ground border-round p-2 mb-2"
                                        >
                                            <div className="field col-4 mb-0">
                                                <label className="text-xs font-medium">Context</label>
                                                <Dropdown
                                                    value={hr.context}
                                                    options={contextOptions}
                                                    onChange={(e) => updateLeadHistoryRuleRef(index, 'context', e.value)}
                                                    placeholder="Select Context"
                                                />
                                            </div>

                                            <div className="field col-7 mb-0">
                                                <label className="text-xs font-medium">Rule</label>
                                                <Dropdown
                                                    value={hr.rule}
                                                    options={historyOptions}
                                                    onChange={(e) => updateLeadHistoryRuleRef(index, 'rule', e.value)}
                                                    placeholder="Select History Rule"
                                                    filter
                                                />
                                            </div>

                                            <div className="col-1 flex justify-content-center align-items-end pt-4">
                                                <Button
                                                    icon="pi pi-trash"
                                                    severity="danger"
                                                    text
                                                    onClick={() => removeLeadHistoryRuleRef(index)}
                                                    tooltip="Remove Reference"
                                                    tooltipOptions={{ position: 'top' }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </AccordionTab>

                        {/* Member Requirements */}
                        <AccordionTab header="Team Member Requirements & Aggregations">
                            <div className="field">
                                <label htmlFor="memberRequirements">Member Requirements</label>
                                <MultiSelect
                                    id="memberRequirements"
                                    value={(localComposition.memberRequirements as string[]) || []}
                                    options={requirementOptions}
                                    onChange={(e) => setLocalComposition({ ...localComposition, memberRequirements: e.value })}
                                    placeholder="Select Member Requirement Rules"
                                    display="chip"
                                    filter
                                />
                            </div>
                        </AccordionTab>
                    </Accordion>
                )}
            </Dialog>
        </>
    );
};

export default SaveComposition;