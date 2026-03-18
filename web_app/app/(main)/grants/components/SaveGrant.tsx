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

    useEffect(() => {
        setLocalGrant({ ...item });
    }, [item]);

    useEffect(() => {
        const loadOrganizations = async () => {
            if (!localGrant.fundingSource) {
                setOrganizations([]);
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
    }, [localGrant.fundingSource]);

    useEffect(
        () => {
            const loadThematics = async () => {
                try {
                    const data = await ThematicApi.getAll({ directorate: localGrant.organization });
                    setThematics(data);
                } catch (err) {
                    console.error('Failed to load themes:', err);
                }
            };
            loadThematics();
        }, [[localGrant.organization]]
    );


    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalGrant({ ...item });
    };

    const saveGrant = async () => {
        setSubmitted(true);
        try {
            const validation = validateGrant(localGrant);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            let saved = localGrant._id
                ? await GrantApi.update(localGrant)
                : await GrantApi.create(localGrant);
            saved = {
                ...saved,
                organization: localGrant.organization
            };
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Grant saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
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
                                organization: undefined, // 👈 reset
                            })
                        }
                        placeholder="Select Funding Source"
                        className={classNames({
                            'p-invalid': submitted && !localGrant.fundingSource,
                        })}
                        //disabled={!!localGrant._id}
                        disabled={!!localGrant.fundingSource}
                    />
                </div>

                <div className="field">
                    <label htmlFor="organization">Organization</label>
                    <Dropdown
                        id="organization"
                        value={localGrant.organization}
                        options={organizations}
                        optionLabel="name"
                        onChange={(e) => setLocalGrant({
                            ...localGrant, organization: e.value,
                            thematic: undefined
                        })}
                        placeholder="Select Funder"
                        className={classNames({ 'p-invalid': submitted && !localGrant.organization })}
                        disabled={!!localGrant._id}
                    />
                </div>
                {/* Title Field */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localGrant.title}
                        onChange={(e) => setLocalGrant({ ...localGrant, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localGrant.title })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="amount">Amount (ETB)</label>
                    <InputNumber
                        id="amount"
                        value={localGrant.amount}
                        onValueChange={(e) => setLocalGrant({ ...localGrant, amount: e.value ?? 0 })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="thematics">Thematics</label>
                    <Dropdown
                        id="thematics"
                        dataKey="_id"
                        value={localGrant.thematic}
                        options={thematics}
                        optionLabel="title"
                        onChange={(e) => setLocalGrant({ ...localGrant, thematic: e.value })}
                        placeholder="Select Thematics"
                    />
                </div>

                {/* Description Field */}
                <div className="field">
                    <label htmlFor="description">Description</label>
                    <InputTextarea
                        id="description"
                        value={localGrant.description ?? ''}
                        onChange={(e) => setLocalGrant({ ...localGrant, description: e.target.value })}
                        rows={4}
                        cols={30}
                    />
                </div>

            </Dialog>
        </>
    );
};

export default SaveGrant;
