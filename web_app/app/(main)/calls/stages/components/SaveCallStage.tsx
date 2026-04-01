'use client';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';

import { CallStageApi } from '../api/call.stage.api';
import { CallStage, validateCallStage } from '../models/call.stage.model';

import { EntitySaveDialogProps } from '@/components/createEntityManager';

import { GrantStage } from '@/app/(main)/grants/stages/models/grant.stage.model';
import { GrantStageApi } from '@/app/(main)/grants/stages/api/grant.stage.api';

import { Call, CallStatus } from '../../models/call.model';
import { CallApi } from '../../api/call.api';

const SaveCallStage = ({
    visible,
    item,
    onHide,
    onComplete
}: EntitySaveDialogProps<CallStage>) => {

    const toast = useRef<Toast>(null);

    const [localStage, setLocalStage] = useState<CallStage>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    const [grantStages, setGrantStages] = useState<GrantStage[]>();
    const [calls, setCalls] = useState<Call[]>();

    const isCallPredefined = !!item.call;
    const isStagePredefined = !!item.grantStage;

    // ---------------------------
    // Load Calls
    // ---------------------------
    useEffect(() => {
        if (isCallPredefined) return;

        const loadCalls = async () => {
            try {
                const data = await CallApi.getAll({
                    status: CallStatus.planned,
                    populate: true
                });
                setCalls(data);
            } catch (err) {
                console.error('Failed to load calls:', err);
            }
        };

        loadCalls();
    }, [isCallPredefined]);

    // ---------------------------
    // Load Grant Stages (depends on selected call)
    // ---------------------------
    useEffect(() => {
        if (isStagePredefined) return;
        const loadStages = async () => {
            try {
                if (!localStage.call) return;

                const call = localStage.call as Call;

                if (!call?.grant) return;

                const data = await GrantStageApi.getAll({
                    grant: call.grant,
                });

                setGrantStages(data);
            } catch (err) {
                console.error('Failed to load grant stages:', err);
            }
        };

        loadStages();
    }, [localStage.call, isStagePredefined]);

    // ---------------------------
    // Sync item
    // ---------------------------
    useEffect(() => {
        setLocalStage({ ...item });
    }, [item]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalStage({ ...item });
    };

    // ---------------------------
    // Save
    // ---------------------------
    const saveStage = async () => {
        try {
            setSubmitted(true);

            const validation = validateCallStage(localStage);
            if (!validation.valid) throw new Error(validation.message);

            let saved: CallStage;

            if (localStage._id) {
                saved = await CallStageApi.update(localStage);
            } else {
                saved = await CallStageApi.create(localStage);
            }

            // keep UI populated
            saved = {
                ...saved,
                call: localStage.call,
                grantStage: localStage.grantStage
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Call Stage saved successfully',
                life: 2000,
            });

            onComplete?.(saved);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Call Stage',
                life: 2000,
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
            <Button label="Save" icon="pi pi-check" text onClick={saveStage} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={localStage._id ? 'Edit Call Stage' : 'New Call Stage'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >

                {/* Call */}
                <div className="field">
                    <label>Call</label>

                    {isCallPredefined ? (
                        <input
                            className="p-inputtext p-component"
                            value={(localStage.call as Call)?.title || ''}
                            disabled
                        />
                    ) : (
                        <Dropdown
                            value={localStage.call}
                            options={calls}
                            optionLabel="title"
                            dataKey="_id"
                            onChange={(e) =>
                                setLocalStage({
                                    ...localStage,
                                    call: e.value,
                                    grantStage: undefined // reset stage when call changes
                                })
                            }
                            placeholder="Select Call"
                            className={classNames({
                                'p-invalid': submitted && !localStage.call
                            })}
                        />
                    )}
                </div>

                {/* Grant Stage */}
                <div className="field">
                    <label htmlFor="grantStage">Grant Stage</label>
                    {isStagePredefined ? (
                        <input
                            className="p-inputtext p-component"
                            value={(localStage.grantStage as any)?.name || ''}
                            disabled
                        />
                    ) : (
                        <Dropdown
                            id="grantStage"
                            value={localStage.grantStage}
                            options={grantStages}
                            optionLabel="name"
                            dataKey="_id"
                            onChange={(e) =>
                                setLocalStage({ ...localStage, grantStage: e.value })
                            }
                            placeholder="Select Stage"
                            className={classNames({
                                'p-invalid': submitted && !localStage.grantStage
                            })}
                        />
                    )}
                </div>

                {/* Deadline */}
                <div className="field">
                    <label htmlFor="deadline">Deadline</label>
                    <PrimeCalendar
                        id="deadline"
                        value={localStage.deadline ? new Date(localStage.deadline) : undefined}
                        onChange={(e) =>
                            setLocalStage({ ...localStage, deadline: e.value as Date })
                        }
                        showIcon
                        dateFormat="yy-mm-dd"
                        className={classNames({
                            'p-invalid': submitted && !localStage.deadline
                        })}
                        showTime
                        hourFormat="12"
                    />
                </div>

            </Dialog>
        </>
    );
};

export default SaveCallStage;