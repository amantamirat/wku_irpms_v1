'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { OrganizationApi } from '../../organizations/api/organization.api';
import { Organization, OrgnUnit } from '../../organizations/models/organization.model';
import { ThematicApi } from '../../thematics/api/thematic.api';
import { Thematic } from '../../thematics/models/thematic.model';
import { ThematicStatus } from '../../thematics/models/thematic.state-machine';
import { GrantApi } from '../api/grant.api';
import { FundingSource, Grant, validateGrant } from '../models/grant.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveGrant = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Grant>) => {
    const toast = useRef<Toast>(null);

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [thematics, setThematics] = useState<Thematic[]>([]);
    const [localGrant, setLocalGrant] = useState<Grant>({ ...item });
    const [submitted, setSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isOrganizationPredefined = !!item.organization;
    const isThematicPredefined = !!item.thematic;

    // Helper to dynamically update form state keys
    const updateField = (key: keyof Grant, value: any) => {
        setLocalGrant((prev) => ({ ...prev, [key]: value }));
    };

    // Synchronize incoming initial item values
    useEffect(() => {
        setLocalGrant({ ...item });
    }, [item]);

    // Handle background lookup configurations on visibility lifecycle shifts
    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
            setLocalGrant({ ...item });
            return;
        }

        const loadDropdownData = async () => {
            try {
                // Load Thematics if not predefined
                if (!isThematicPredefined) {
                    const thematicData = await ThematicApi.getAll({ status: ThematicStatus.published });
                    setThematics(thematicData);
                }

                // Load Organizations if Funding Source is already established
                if (localGrant.fundingSource && !isOrganizationPredefined) {
                    const unitType = localGrant.fundingSource === FundingSource.INTERNAL 
                        ? OrgnUnit.directorate 
                        : OrgnUnit.external;
                    const orgData = await OrganizationApi.getAll({ type: unitType });
                    setOrganizations(orgData);
                }
            } catch (err) {
                console.error('Error bootstrapping dialog metadata:', err);
            }
        };

        loadDropdownData();
    }, [visible, localGrant.fundingSource, isOrganizationPredefined, isThematicPredefined]);

    // Form execution logic
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        const validation = validateGrant(localGrant);
        if (!validation.valid) {
            toast.current?.show({
                severity: 'error',
                summary: 'Validation Error',
                detail: validation.message,
                life: 3000,
            });
            return;
        }

        try {
            setIsSaving(true);
            let saved: Grant;

            if (localGrant._id) {
                saved = await GrantApi.update(localGrant);
            } else {
                saved = await GrantApi.create(localGrant);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Grant saved successfully',
                life: 2000,
            });

            onComplete?.({
                ...saved,
                organization: localGrant.organization,
                thematic: localGrant.thematic,
            });
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Persistence Error',
                detail: err.message || 'Failed to save Grant',
                life: 3000,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleHide = () => {
        setSubmitted(false);
        setLocalGrant({ ...item });
        onHide();
    };

    // Dialog footer actions context setup
    const footerActions = (
        <div className="flex justify-content-end gap-2">
            <Button 
                type="button" 
                label="Cancel" 
                icon="pi pi-times" 
                text 
                onClick={handleHide} 
                disabled={isSaving} 
            />
            <Button 
                type="submit" 
                form="grant-form" 
                label="Save" 
                icon="pi pi-check" 
                loading={isSaving} 
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localGrant._id ? 'Edit Grant' : 'New Grant'}
                modal
                className="p-fluid"
                footer={footerActions}
                onHide={handleHide}
            >
                <form id="grant-form" onSubmit={handleSave} className="flex flex-column gap-3 mt-2">
                    
                    {/* Funding Source Dropdown */}
                    <div className="field">
                        <label htmlFor="source" className="font-semibold block mb-2">Source</label>
                        <Dropdown
                            id="source"
                            value={localGrant.fundingSource}
                            options={Object.values(FundingSource).map((f) => ({ label: f, value: f }))}
                            onChange={(e) => {
                                setLocalGrant((prev) => ({
                                    ...prev,
                                    fundingSource: e.value,
                                    organization: undefined,
                                    thematic: undefined,
                                }));
                            }}
                            placeholder="Select Funding Source"
                            className={classNames({ 'p-invalid': submitted && !localGrant.fundingSource })}
                            disabled={!!localGrant._id || isOrganizationPredefined}
                        />
                    </div>

                    {/* Dynamic Organization field rendering context */}
                    {!localGrant._id && (
                        <div className="field">
                            <label htmlFor="organization" className="font-semibold block mb-2">Organization (Funder)</label>
                            {isOrganizationPredefined ? (
                                <InputText
                                    value={(localGrant.organization as Organization)?.name || ''}
                                    disabled
                                />
                            ) : (
                                <Dropdown
                                    id="organization"
                                    value={localGrant.organization}
                                    options={organizations}
                                    optionLabel="name"
                                    onChange={(e) => updateField('organization', e.value)}
                                    placeholder="Select Organization"
                                    disabled={!localGrant.fundingSource}
                                    className={classNames({ 'p-invalid': submitted && !localGrant.organization })}
                                />
                            )}
                        </div>
                    )}

                    {/* Title Input field setup */}
                    <div className="field">
                        <label htmlFor="title" className="font-semibold block mb-2">Title</label>
                        <InputText
                            id="title"
                            value={localGrant.title || ''}
                            onChange={(e) => updateField('title', e.target.value)}
                            required
                            autoFocus
                            className={classNames({ 'p-invalid': submitted && !localGrant.title })}
                        />
                    </div>

                    {/* Numeric Input Currency context configuration wrapper */}
                    <div className="field">
                        <label htmlFor="amount" className="font-semibold block mb-2">Amount (ETB)</label>
                        <InputNumber
                            id="amount"
                            value={localGrant.amount}
                            onValueChange={(e) => updateField('amount', e.value ?? 0)}
                            mode="currency"
                            currency="ETB"
                            locale="am-ET"
                        />
                    </div>

                    {/* Dynamic Thematic Context Select Field Setup */}
                    {!localGrant._id && (
                        <div className="field">
                            <label htmlFor="thematic" className="font-semibold block mb-2">Thematic</label>
                            {isThematicPredefined ? (
                                <InputText
                                    value={(localGrant.thematic as Thematic)?.title || ''}
                                    disabled
                                />
                            ) : (
                                <Dropdown
                                    id="thematic"
                                    value={localGrant.thematic}
                                    options={thematics}
                                    optionLabel="title"
                                    onChange={(e) => updateField('thematic', e.value)}
                                    placeholder="Select Thematic"
                                />
                            )}
                        </div>
                    )}

                    {/* Detailed Metadata Input Area Wrapper */}
                    <div className="field">
                        <label htmlFor="description" className="font-semibold block mb-2">Description</label>
                        <InputTextarea
                            id="description"
                            value={localGrant.description ?? ''}
                            onChange={(e) => updateField('description', e.target.value)}
                            rows={4}
                            autoResize
                        />
                    </div>

                </form>
            </Dialog>
        </>
    );
};

export default SaveGrant;