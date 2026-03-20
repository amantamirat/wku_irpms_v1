'use client';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';

import { OrganizationApi } from '../../organizations/api/organization.api';
import { Organization, OrgnUnit } from '../../organizations/models/organization.model';

import { ThematicApi } from '../../thematics/api/thematic.api';
import { Thematic } from '../../thematics/models/thematic.model';

import { GrantApi } from '../api/grant.api';
import { FundingSource, Grant, validateGrant } from '../models/grant.model';

import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveGrant = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Grant>) => {

    const toast = useRef<Toast>(null);

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [thematics, setThematics] = useState<Thematic[]>([]);
    const [localGrant, setLocalGrant] = useState<Grant>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    const isOrganizationPredefined = !!item.organization;
    const isThematicPredefined = !!item.thematic;

    // ---------------------------
    // Sync item
    // ---------------------------
    useEffect(() => {
        setLocalGrant({ ...item });
    }, [item]);

    // ---------------------------
    // Load Organizations
    // ---------------------------
    useEffect(() => {
        const loadOrganizations = async () => {
            if (!localGrant.fundingSource || isOrganizationPredefined) {
                return;
            }

            try {
                const unitType =
                    localGrant.fundingSource === FundingSource.INTERNAL
                        ? OrgnUnit.directorate
                        : OrgnUnit.external;

                const data = await OrganizationApi.getAll({ type: unitType });
                setOrganizations(data);
            } catch (err) {
                console.error('Failed to load organizations:', err);
                setOrganizations([]);
            }
        };

        loadOrganizations();
    }, [localGrant.fundingSource, isOrganizationPredefined]);

    // ---------------------------
    // Load Thematics
    // ---------------------------
    useEffect(() => {
        const loadThematics = async () => {
            if (isThematicPredefined) return;

            try {
                const data = await ThematicApi.getAll({
                   // directorate: localGrant.organization
                });
                setThematics(data);
            } catch (err) {
                console.error('Failed to load thematics:', err);
            }
        };

        loadThematics();
    }, [isThematicPredefined]);

    // ---------------------------
    // Reset on close
    // ---------------------------
    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalGrant({ ...item });
    };

    // ---------------------------
    // Save
    // ---------------------------
    const saveGrant = async () => {
        try {
            setSubmitted(true);

            const validation = validateGrant(localGrant);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Grant;

            if (localGrant._id) saved = await GrantApi.update(localGrant);
            else saved = await GrantApi.create(localGrant);

            saved = {
                ...saved,
                organization: localGrant.organization,
                thematic: localGrant.thematic
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Grant saved successfully',
                life: 2000,
            });

            onComplete?.(saved);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Grant',
                life: 2500,
            });
        }
    };

    const hide = () => {
        clearForm();
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveGrant} />
        </>
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
                footer={footer}
                onHide={hide}
            >

                {/* Funding Source */}
                <div className="field">
                    <label htmlFor="source">Source</label>
                    <Dropdown
                        id="source"
                        value={localGrant.fundingSource}
                        options={Object.values(FundingSource).map((f) => ({
                            label: f,
                            value: f,
                        }))}
                        onChange={(e) =>
                            setLocalGrant({
                                ...localGrant,
                                fundingSource: e.value,
                                organization: undefined,
                                thematic: undefined
                            })
                        }
                        placeholder="Select Funding Source"
                        className={classNames({
                            'p-invalid': submitted && !localGrant.fundingSource,
                        })}
                        disabled={!!localGrant._id || isOrganizationPredefined ||true}
                    />
                </div>

                {/* Organization */}
                {!localGrant._id && (
                    <div className="field">
                        <label htmlFor="organization">Organization</label>

                        {isOrganizationPredefined ? (
                            <InputText
                                value={(localGrant.organization as Organization)?.name}
                                disabled
                            />
                        ) : (
                            <Dropdown
                                id="organization"
                                value={localGrant.organization}
                                options={organizations}
                                optionLabel="name"
                                onChange={(e) =>
                                    setLocalGrant({
                                        ...localGrant,
                                        organization: e.value,
                                        thematic: undefined
                                    })
                                }
                                placeholder="Select Organization (Funder)"
                                className={classNames({
                                    'p-invalid': submitted && !localGrant.organization
                                })}
                            />
                        )}
                    </div>
                )}

                {/* Title */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localGrant.title}
                        onChange={(e) =>
                            setLocalGrant({ ...localGrant, title: e.target.value })
                        }
                        required
                        autoFocus
                        className={classNames({
                            'p-invalid': submitted && !localGrant.title
                        })}
                    />
                </div>

                {/* Amount */}
                <div className="field">
                    <label htmlFor="amount">Amount (ETB)</label>
                    <InputNumber
                        id="amount"
                        value={localGrant.amount}
                        onValueChange={(e) =>
                            setLocalGrant({
                                ...localGrant,
                                amount: e.value ?? 0
                            })
                        }
                    />
                </div>

                {/* Thematic */}
                {!localGrant._id && (
                    <div className="field">
                        <label htmlFor="thematic">Thematic</label>

                        {isThematicPredefined ? (
                            <InputText
                                value={(localGrant.thematic as Thematic)?.title}
                                disabled
                            />
                        ) : (
                            <Dropdown
                                id="thematic"
                                value={localGrant.thematic}
                                options={thematics}
                                optionLabel="title"
                                onChange={(e) =>
                                    setLocalGrant({
                                        ...localGrant,
                                        thematic: e.value
                                    })
                                }
                                placeholder="Select Thematic"
                            />
                        )}
                    </div>
                )}

                {/* Description */}
                <div className="field">
                    <label htmlFor="description">Description</label>
                    <InputTextarea
                        id="description"
                        value={localGrant.description ?? ''}
                        onChange={(e) =>
                            setLocalGrant({
                                ...localGrant,
                                description: e.target.value
                            })
                        }
                        rows={4}
                    />
                </div>

            </Dialog>
        </>
    );
};

export default SaveGrant;