'use client';
import { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { Composition, OperationMode } from '../models/composition.model';
import { CompositionApi } from '../api/composition.api';
import { validateComposition } from '../models/composition.model';
import { genderOptions } from '@/app/(main)/applicants/models/applicant.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveComposition = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<Composition>) => {

    const toast = useRef<Toast>(null);
    const [localComposition, setLocalComposition] =
        useState<Composition>({ ...item });

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

    const footer = (
        <>
            <Button label="Cancel" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" onClick={save} />
        </>
    );

    const opModeOptions = Object.values(OperationMode).map(opm => ({
        label: opm,
        value: opm
    }));

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '750px' }}
                maximizable
                header={localComposition._id ? 'Edit Composition' : 'New Composition'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >

                <Accordion multiple activeIndex={[0]}>

                    {/* 🔹 Basic Information */}
                    <AccordionTab header="Basic Information">

                        <div className="field">
                            <label>Title</label>
                            <InputText
                                value={localComposition.title}
                                onChange={(e) =>
                                    setLocalComposition({ ...localComposition, title: e.target.value })
                                }
                                className={classNames({
                                    'p-invalid': submitted && !localComposition.title
                                })}
                            />
                        </div>

                        <div className="formgrid grid">
                            <div className="field col">
                                <label htmlFor="mode">Mode</label>
                                <Dropdown
                                    id="opMode"
                                    value={localComposition.opMode}
                                    options={opModeOptions}
                                    onChange={(e) => setLocalComposition({ ...localComposition, opMode: e.value })}
                                    placeholder="Select Mode"
                                    className={classNames({ 'p-invalid': submitted && !localComposition.opMode })}
                                />
                            </div>
                            <div className="field col">
                                <label>Minimum Required Members</label>
                                <InputNumber
                                    value={localComposition.minCount}
                                    onValueChange={(e) =>
                                        setLocalComposition({
                                            ...localComposition,
                                            minCount: e.value ?? 1
                                        })
                                    }
                                    disabled={localComposition.isPI}
                                />
                            </div>
                        </div>


                    </AccordionTab>

                    {/* 🔹 Eligibility Filters */}
                    <AccordionTab header="Eligibility Filters">

                        <div className="field">
                            <label htmlFor="gender">Gender</label>
                            <Dropdown
                                id="gender"
                                value={localComposition.gender}
                                options={genderOptions}
                                onChange={(e) =>
                                    setLocalComposition({
                                        ...localComposition,
                                        gender: e.value
                                    })}
                                placeholder="Select Gender"
                            />
                        </div>

                        <div className="grid">
                            <div className="col-6">
                                <label>Min Age</label>
                                <InputNumber
                                    value={localComposition.age?.min}
                                    onValueChange={(e) =>
                                        setLocalComposition({
                                            ...localComposition,
                                            age: {
                                                min: e.value ?? 0,
                                                max: localComposition.age?.max ?? 0
                                            }
                                        })
                                    }
                                />
                            </div>

                            <div className="col-6">
                                <label>Max Age</label>
                                <InputNumber
                                    value={localComposition.age?.max}
                                    onValueChange={(e) =>
                                        setLocalComposition({
                                            ...localComposition,
                                            age: {
                                                min: localComposition.age?.min ?? 0,
                                                max: e.value ?? 0
                                            }
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid mt-3">
                            <div className="col-6">
                                <label>Min Experience (Years)</label>
                                <InputNumber
                                    value={localComposition.experienceYears?.min}
                                    onValueChange={(e) =>
                                        setLocalComposition({
                                            ...localComposition,
                                            experienceYears: {
                                                min: e.value ?? 0,
                                                max: localComposition.experienceYears?.max ?? 0
                                            }
                                        })
                                    }
                                />
                            </div>

                            <div className="col-6">
                                <label>Max Experience (Years)</label>
                                <InputNumber
                                    value={localComposition.experienceYears?.max}
                                    onValueChange={(e) =>
                                        setLocalComposition({
                                            ...localComposition,
                                            experienceYears: {
                                                min: localComposition.experienceYears?.min ?? 0,
                                                max: e.value ?? 0
                                            }
                                        })
                                    }
                                />
                            </div>
                        </div>

                    </AccordionTab>

                    {/* 🔹 Academic & Roles */}
                    <AccordionTab header="Academic & Roles">

                        <div className="field">
                            <label>Specializations</label>
                            <MultiSelect
                                value={localComposition.specializations}
                                options={[]} // load from API
                                optionLabel="name"
                                placeholder="Select Specializations"
                                onChange={(e) =>
                                    setLocalComposition({
                                        ...localComposition,
                                        specializations: e.value
                                    })
                                }
                            />
                        </div>

                        <div className="field">
                            <label>Positions</label>
                            <MultiSelect
                                value={localComposition.positions}
                                options={[]} // load from API
                                optionLabel="name"
                                placeholder="Select Positions"
                                onChange={(e) =>
                                    setLocalComposition({
                                        ...localComposition,
                                        positions: e.value
                                    })
                                }
                            />
                        </div>

                    </AccordionTab>

                    {/* 🔹 Advanced Settings */}
                    <AccordionTab header="Advanced Settings">

                        <div className="field-checkbox">
                            <Checkbox
                                checked={localComposition.isPI ?? false}
                                onChange={(e) =>
                                    setLocalComposition({
                                        ...localComposition,
                                        isPI: e.checked ?? false,
                                        minCount: e.checked ? 1 : localComposition.minCount, // force 1 if PI
                                    })
                                }
                                disabled={!!localComposition._id && localComposition.isPI}
                            />
                            <label className="ml-2">
                                Principal Investigator (PI)
                            </label>
                        </div>

                        <div className="field mt-3">
                            <label>Max Submission</label>
                            <InputNumber
                                value={localComposition.maxSubmission}
                                onValueChange={(e) =>
                                    setLocalComposition({
                                        ...localComposition,
                                        maxSubmission: e.value ?? 0
                                    })
                                }
                            />
                        </div>

                        <div className="field">
                            <label>Min Completion</label>
                            <InputNumber
                                value={localComposition.minCompletion}
                                onValueChange={(e) =>
                                    setLocalComposition({
                                        ...localComposition,
                                        minCompletion: e.value ?? 0
                                    })
                                }
                            />
                        </div>

                    </AccordionTab>

                </Accordion>

            </Dialog>
        </>
    );
};

export default SaveComposition;
