'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { extractId } from '@/utils/utils';

import { ConstraintApi } from '../../constraints/api/constraint.api';
import { Constraint } from '../../constraints/models/constraint.model';
import { OrganizationApi } from '../../organizations/api/organization.api';
import { Organization, OrgnUnit } from '../../organizations/models/organization.model';
import { ThematicApi } from '../../thematics/api/thematic.api';
import { Thematic } from '../../thematics/models/thematic.model';
import { ThematicStatus } from '../../thematics/models/thematic.state-machine';
import { DocumentTemplateApi } from '../../documentTemplates/api/documentTemplate.api';

import {
    FundingSource,
    Grant,
    validateGrant
} from '../models/grant.model';

const GrantForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Grant>) => {
    const [localGrant, setLocalGrant] = useState<Grant>(() => ({
        ...item,
        amount: item?.amount ?? 100000
    }));

    const [submitted, setSubmitted] = useState(false);

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [thematics, setThematics] = useState<Thematic[]>([]);
    const [constraints, setConstraints] = useState<Constraint[]>([]);
    const [agreementTemplates, setAgreementTemplates] = useState<any[]>([]);

    useEffect(() => {
        setLocalGrant({
            ...item,
            amount: item?.amount ?? 100000
        });
        setSubmitted(false);
    }, [item]);

    useEffect(() => {
        let cancelled = false;

        const loadOptions = async () => {
            try {
                const [
                    constraintData,
                    thematicData,
                    templateData
                ] = await Promise.all([
                    ConstraintApi.lookup!(),
                    ThematicApi.lookup!({
                        status: ThematicStatus.published
                    }),
                    DocumentTemplateApi.lookup!()
                ]);

                if (cancelled) return;

                setConstraints(constraintData);
                setThematics(thematicData);
                setAgreementTemplates(templateData);
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        'Error loading grant form options:',
                        error
                    );
                }
            }
        };

        void loadOptions();

        return () => {
            cancelled = true;
        };
    }, []);


    useEffect(() => {
        let cancelled = false;

        const loadOrganization = async () => {
            // No funding source: don't load organizations.
            if (!localGrant.fundingSource) {
                setOrganizations([]);
                return;
            }

            try {
                const unitType =
                    localGrant.fundingSource === FundingSource.INTERNAL
                        ? OrgnUnit.directorate
                        : OrgnUnit.external;

                const orgData = await OrganizationApi.lookup!({
                    type: unitType
                });

                if (cancelled) return;

                setOrganizations(orgData);

                // Clear an organization that doesn't belong
                // to the newly selected funding source.
                const selectedOrganizationId = extractId(
                    localGrant.organization
                );

                if (
                    selectedOrganizationId &&
                    !orgData.some(
                        (organization) =>
                            extractId(organization) === selectedOrganizationId
                    )
                ) {
                    setLocalGrant((previous) => ({
                        ...previous,
                        organization: undefined
                    }));
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        'Error loading organizations:',
                        error
                    );
                    setOrganizations([]);
                }
            }
        };

        void loadOrganization();

        return () => {
            cancelled = true;
        };
    }, [localGrant.fundingSource]);

    const updateField = <K extends keyof Grant>(
        key: K,
        value: Grant[K]
    ) => {
        setLocalGrant((previous) => ({
            ...previous,
            [key]: value
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        const normalizedGrant: Grant = {
            ...localGrant,
            title: localGrant.title?.trim() ?? '',
            description: localGrant.description?.trim() || undefined,
            //constraint: extractId(localGrant.constraint) || null,
            agreementTemplate:
                extractId(localGrant.agreementTemplate) || null
        };

        const result = validateGrant(normalizedGrant);

        if (!result.valid) return;

        await onSubmit(normalizedGrant);
    };

    const validation = submitted
        ? validateGrant({
            ...localGrant,
            title: localGrant.title?.trim() ?? ''
        })
        : undefined;

    const fieldInvalid = (field: keyof Grant) => {
        if (!submitted) return false;

        switch (field) {
            case 'title':
                return !localGrant.title?.trim();
            case 'fundingSource':
                return !localGrant.fundingSource;
            case 'organization':
                return !localGrant.organization;
            case 'amount':
                return !Number.isFinite(localGrant.amount) ||
                    (localGrant.amount ?? 0) <= 0;
            case 'thematic':
                return !localGrant.thematic;
            default:
                return false;
        }
    };

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="formgrid grid p-fluid"
            noValidate
        >
            {/* Grant Title */}
            <div className="field col-12">
                <label htmlFor="grant-title" className="font-medium text-900 block mb-2">
                    Grant Title <span className="text-red-500">*</span>
                </label>
                <InputText
                    id="grant-title"
                    value={localGrant.title ?? ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="Enter descriptive grant title"
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('title')
                    })}
                />
                {fieldInvalid('title') && (
                    <small className="p-error block mt-1">Grant title is required.</small>
                )}
            </div>

            {/* Funding Source & Organization */}
            <div className="field col-12 md:col-6">
                <label htmlFor="grant-funding-source" className="font-medium text-900 block mb-2">
                    Funding Source <span className="text-red-500">*</span>
                </label>
                <Dropdown
                    id="grant-funding-source"
                    value={localGrant.fundingSource}
                    options={Object.values(FundingSource).map((source) => ({
                        label: source,
                        value: source
                    }))}
                    onChange={(e) => updateField('fundingSource', e.value)}
                    placeholder="Select Funding Source"
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('fundingSource')
                    })}
                />
                {fieldInvalid('fundingSource') && (
                    <small className="p-error block mt-1">Funding source is required.</small>
                )}
            </div>

            <div className="field col-12 md:col-6">
                <label htmlFor="grant-organization" className="font-medium text-900 block mb-2">
                    Organization (Funder) <span className="text-red-500">*</span>
                </label>
                <Dropdown
                    id="grant-organization"
                    value={extractId(localGrant.organization)}
                    options={organizations}
                    optionLabel="name"
                    optionValue="_id"
                    onChange={(e) =>
                        updateField('organization', e.value as Grant['organization'])
                    }
                    placeholder="Select Organization"
                    showClear
                    filter
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('organization')
                    })}
                />
                {fieldInvalid('organization') && (
                    <small className="p-error block mt-1">Organization is required.</small>
                )}
            </div>

            {/* Amount & Thematic Area */}
            <div className="field col-12 md:col-6">
                <label htmlFor="grant-amount" className="font-medium text-900 block mb-2">
                    Amount (ETB) <span className="text-red-500">*</span>
                </label>
                <InputNumber
                    id="grant-amount"
                    value={localGrant.amount ?? 0}
                    onValueChange={(e) => updateField('amount', e.value ?? 0)}
                    mode="currency"
                    currency="ETB"
                    locale="en-US"
                    min={0}
                    placeholder="0.00"
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('amount')
                    })}
                />
                {fieldInvalid('amount') && (
                    <small className="p-error block mt-1">
                        Enter a valid amount greater than zero.
                    </small>
                )}
            </div>

            <div className="field col-12 md:col-6">
                <label htmlFor="grant-thematic" className="font-medium text-900 block mb-2">
                    Thematic Area <span className="text-red-500">*</span>
                </label>
                <Dropdown
                    id="grant-thematic"
                    value={extractId(localGrant.thematic)}
                    options={thematics}
                    optionLabel="title"
                    optionValue="_id"
                    onChange={(e) =>
                        updateField('thematic', e.value as Grant['thematic'])
                    }
                    placeholder="Select Thematic Area"
                    showClear
                    filter
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('thematic')
                    })}
                />
                {fieldInvalid('thematic') && (
                    <small className="p-error block mt-1">Thematic area is required.</small>
                )}
            </div>

            {/* Constraint Profile & Agreement Template */}
            <div className="field col-12 md:col-6">
                <label htmlFor="grant-constraint" className="font-medium text-900 block mb-2">
                    Constraint Profile
                </label>
                <Dropdown
                    id="grant-constraint"
                    value={extractId(localGrant.constraint)}
                    options={constraints}
                    optionLabel="name"
                    optionValue="_id"
                    onChange={(e) =>
                        updateField(
                            'constraint',
                            (e.value ?? null) as Grant['constraint']
                        )
                    }
                    placeholder="Select Constraint (Optional)"
                    showClear
                    filter
                    className="w-full"
                />
            </div>

            <div className="field col-12 md:col-6">
                <label
                    htmlFor="grant-agreement-template"
                    className="font-medium text-900 block mb-2"
                >
                    Agreement Template
                </label>
                <Dropdown
                    id="grant-agreement-template"
                    value={extractId(localGrant.agreementTemplate)}
                    options={agreementTemplates}
                    optionLabel="name"
                    optionValue="_id"
                    onChange={(e) =>
                        updateField(
                            'agreementTemplate',
                            (e.value ?? null) as Grant['agreementTemplate']
                        )
                    }
                    placeholder="Select Agreement Template (Optional)"
                    showClear
                    filter
                    className="w-full"
                />
            </div>

            {/* Description */}
            <div className="field col-12">
                <label htmlFor="grant-description" className="font-medium text-900 block mb-2">
                    Description
                </label>
                <InputTextarea
                    id="grant-description"
                    value={localGrant.description ?? ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    placeholder="Enter additional notes or description..."
                    autoResize
                    className="w-full"
                />
            </div>

            {validation && !validation.valid && (
                <div className="col-12">
                    <small className="p-error block">{validation.message}</small>
                </div>
            )}
        </form>
    );
};

export default GrantForm;