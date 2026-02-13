'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import type { ApplicantConstraintType } from '../../models/applicant-constaint-type';
import { ApplicantDynamicType, ApplicantListType, getListOptions, isDynamicConstraint, isListConstraint, isRangeConstraint } from '../../models/applicant-constaint-type';
import { Constraint } from '../../models/constraint.model';
import { CompositionApi } from '../api/composition.api';
import { Composition, validateComposition } from '../models/composition.model';
import { OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { SpecializationApi } from '@/app/(main)/specializations/api/specialization.api';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';

interface SaveDialogProps {
    visible: boolean;
    composition: Composition;
    onComplete?: (saved: Composition) => void;
    parent: Constraint;
    onHide: () => void;
}

const SaveDialog = ({ visible, composition, onComplete, onHide, parent }: SaveDialogProps) => {
    const [itemOptions, setItemOptions] = useState<any[] | undefined>();
    const [localComposition, setLocalComposition] = useState<Composition>({ ...composition });
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);
    const [dynamicOptions, setDynamicOptions] = useState<any[] | undefined>();


    // Sync prop changes
    useEffect(() => {
        setLocalComposition({ ...composition });
    }, [composition]);

    useEffect(() => {
        const constraint = parent.constraint as ApplicantConstraintType;

        // LIST TYPE (Gender, Scope, etc.)
        if (isListConstraint(constraint)) {
            const options = getListOptions(constraint);
            setItemOptions(options);
            setDynamicOptions(undefined);
        }

        // DYNAMIC TYPE (Workspace, Specialization)
        else if (isDynamicConstraint(constraint)) {
            const fetchDynamicOptions = async () => {
                try {
                    // SPECIALIZATION
                    if (constraint === ApplicantDynamicType.SPECIALIZATION) {
                        const specs = await SpecializationApi.getSpecializations();
                        setDynamicOptions(specs);
                    }

                    // WORKSPACE
                    if (constraint === ApplicantDynamicType.WORKSPACE) {
                        const departments = await OrganizationApi.getOrganizations({
                            type: OrgnUnit.Department
                        });

                        const externals = await OrganizationApi.getOrganizations({
                            type: OrgnUnit.External
                        });

                        setDynamicOptions([...departments, ...externals]);
                    }
                } catch (err) {
                    console.error("Failed to fetch dynamic options:", err);
                }
            };

            fetchDynamicOptions();
            setItemOptions(undefined);
        }

        // RANGE TYPE
        else {
            setItemOptions(undefined);
            setDynamicOptions(undefined);
        }
    }, [parent.constraint]);

    useEffect(() => {
        setLocalComposition(prev => ({
            ...prev,
            enumValue: undefined,
            item: undefined,
            range: undefined
        }));
    }, [parent.constraint]);


    const saveComposition = async () => {
        setSubmitted(true);
        try {
            const validation = validateComposition(localComposition);
            if (!validation.valid) throw new Error(validation.message);

            let saved = localComposition._id
                ? await CompositionApi.updateComposition(localComposition)
                : await CompositionApi.createComposition(localComposition);
            saved = {
                ...saved,
                constraint: localComposition.constraint,
                item: localComposition.item
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Composition saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save composition',
                life: 2000,
            });
        } finally {
            setSubmitted(false);
        }
    };

    // Reset when dialog closes
    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalComposition({ ...composition });
    };

    const hide = () => {
        clearForm();
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveComposition} />
        </>
    );



    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localComposition._id ? 'Edit Composition' : 'New Composition'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Composition min/max (ALWAYS REQUIRED) */}
                <div className="field">
                    <label htmlFor="compMin">Minimum Applicants</label>
                    <InputNumber
                        id="compMin"
                        value={localComposition.min}
                        onChange={(e) =>
                            setLocalComposition({
                                ...localComposition,
                                min: e.value ?? 0,
                            })
                        }
                        required
                        className={classNames({
                            "p-invalid": submitted && localComposition.min == null,
                        })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="compMax">Maximum Applicants</label>
                    <InputNumber
                        id="compMax"
                        value={localComposition.max}
                        onChange={(e) =>
                            setLocalComposition({
                                ...localComposition,
                                max: e.value ?? 0,
                            })
                        }
                        required
                        className={classNames({
                            "p-invalid": submitted && localComposition.max == null,
                        })}
                    />
                </div>

                {/* Range filtering (AGE, EXPERIENCE, etc.) */}
                {isRangeConstraint(parent.constraint as ApplicantConstraintType) && (
                    <>
                        <div className="field">
                            <label htmlFor="rangeMin">Range Minimum ({parent.constraint})</label>
                            <InputNumber
                                id="rangeMin"
                                value={localComposition.range?.min}
                                onChange={(e) =>
                                    setLocalComposition({
                                        ...localComposition,
                                        range: {
                                            min: e.value ?? 0,
                                            max: localComposition.range?.max ?? 0,
                                        },
                                    })
                                }
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="rangeMax">Range Maximum ({parent.constraint})</label>
                            <InputNumber
                                id="rangeMax"
                                value={localComposition.range?.max}
                                onChange={(e) =>
                                    setLocalComposition({
                                        ...localComposition,
                                        range: {
                                            min: localComposition.range?.min ?? 0,
                                            max: e.value ?? 0,
                                        },
                                    })
                                }
                            />
                        </div>
                    </>
                )}

                {/* List filtering (Gender, Scope, etc.) */}
                {/* LIST filtering (Gender, Scope, etc.) */}
                {isListConstraint(parent.constraint as ApplicantConstraintType) && (
                    <div className="field">
                        <label htmlFor="enumValue">
                            {`Select ${parent.constraint}`}
                        </label>

                        <Dropdown
                            id="enumValue"
                            value={localComposition.enumValue}
                            options={itemOptions?.map((o) => ({
                                label: o,
                                value: o,
                            }))}
                            onChange={(e) =>
                                setLocalComposition({
                                    ...localComposition,
                                    enumValue: e.value,
                                })
                            }
                            placeholder="Select"
                        />
                    </div>
                )}

                {/* DYNAMIC filtering (Workspace, Specialization) */}
                {isDynamicConstraint(parent.constraint as ApplicantConstraintType) && (
                    <div className="field">
                        <label htmlFor="item">
                            {parent.constraint === ApplicantDynamicType.SPECIALIZATION
                                ? "Specialization"
                                : "Workspace"}
                        </label>

                        <Dropdown
                            id="item"
                            value={localComposition.item}
                            options={dynamicOptions?.map((o: any) => ({
                                label: o.name,
                                value: o,
                            }))}
                            onChange={(e) =>
                                setLocalComposition({
                                    ...localComposition,
                                    item: e.value,
                                })
                            }
                            placeholder="Select"
                        />
                    </div>
                )}

            </Dialog>
        </>
    );
};

export default SaveDialog;
