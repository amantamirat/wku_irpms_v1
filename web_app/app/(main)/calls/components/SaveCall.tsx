'use client';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber'; // <-- Import InputNumber
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { GrantAllocationApi } from '../../grants/allocations/api/grant.allocation.api';
import { allocationOptionTemplate, getAllocationLabel } from '../../grants/allocations/components/AllocationTempletes';
import { GrantAllocation } from '../../grants/allocations/models/grant.allocation.model';
import { AllocationStatus } from '../../grants/allocations/models/grant.allocation.state-machine';
import { CallApi } from '../api/call.api';
import { Call, sanitizeCall, validateCall } from '../models/call.model';

interface ExtendedCall extends Call {
    _filterCalendar?: string;
    _filterGrant?: string;
}

const SaveCall = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<ExtendedCall>) => {
    const toast = useRef<Toast>(null);
    const [localCall, setLocalCall] = useState<Call>({ ...item });
    const [submitted, setSubmitted] = useState(false);
    const [allocations, setAllocations] = useState<GrantAllocation[]>([]);

    const isAllocationPredefined = !!item.grantAllocation;

    // Load available allocations (Year + Grant combinations)
    useEffect(() => {
        if (isAllocationPredefined || !visible) return;
        const loadAllocations = async () => {
            try {
                const query: any = {
                    status: AllocationStatus.active,
                    populate: true
                };

                if (item._filterCalendar) query.calendar = item._filterCalendar;
                if (item._filterGrant) query.grant = item._filterGrant;

                const data = await GrantAllocationApi.getAll(query);
                setAllocations(data);

                if (data.length === 1 && !localCall.grantAllocation) {
                    setLocalCall(prev => ({ ...prev, grantAllocation: data[0] }));
                }
            } catch (err) {
                console.error('Failed to load allocations:', err);
            }
        };
        loadAllocations();
    }, [isAllocationPredefined, visible, item._filterCalendar, item._filterGrant]);

    useEffect(() => {
        setLocalAllocationSync();
    }, [item]);

    const setLocalAllocationSync = () => setLocalCall({ ...item });

    const clearForm = () => {
        setSubmitted(false);
        setLocalCall({ ...item });
    };

    const saveCall = async () => {
        try {
            setSubmitted(true);
            
            // Basic layout validation
            const validation = validateCall(localCall);
            if (!validation.valid) throw new Error(validation.message);
            
            // Frontend safety check: Ensure user filled in a positive number
            if (localCall.budget === undefined || localCall.budget === null || localCall.budget <= 0) {
                throw new Error("Please provide a valid funding budget amount greater than 0.");
            }

            const payload = sanitizeCall(localCall);
            let saved: Call;

            if (localCall._id) saved = await CallApi.update(payload);
            else saved = await CallApi.create(payload as Call);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Call saved successfully',
                life: 2000,
            });

            onComplete?.({ ...saved, grantAllocation: localCall.grantAllocation });
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Call',
                life: 3000,
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
            <Button label="Save" icon="pi pi-check" onClick={saveCall} severity="success" />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '550px' }}
                header={localCall._id ? 'Edit Call' : 'New Strategic Call'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Allocation Selector */}
                <div className="field">
                    <label htmlFor="grantAllocation" className="font-bold">Funding Allocation</label>

                    {isAllocationPredefined ? (
                        <InputText
                            value={getAllocationLabel(localCall.grantAllocation)}
                            disabled
                        />
                    ) : (
                        <Dropdown
                            id="grantAllocation"
                            value={localCall.grantAllocation}
                            options={allocations}
                            optionLabel="_id"
                            dataKey="_id"
                            onChange={(e) => setLocalCall({ ...localCall, grantAllocation: e.value })}
                            valueTemplate={(option, props) => option ? allocationOptionTemplate(option) : props.placeholder}
                            itemTemplate={allocationOptionTemplate}
                            placeholder="Select Year and Grant Source"
                            className={classNames({ 'p-invalid': submitted && !localCall.grantAllocation })}
                        />
                    )}
                </div>

                <div className="field">
                    <label htmlFor="title" className="font-bold">Call Title</label>
                    <InputText
                        id="title"
                        value={localCall.title}
                        onChange={(e) => setLocalCall({ ...localCall, title: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localCall.title })}
                    />
                </div>

                {/* --- Added Budget Field --- */}
                <div className="field">
                    <label htmlFor="budget" className="font-bold">Allocated Budget</label>
                    <InputNumber
                        id="budget"
                        value={localCall.budget ?? null}
                        onValueChange={(e) => setLocalCall({ ...localCall, budget: e.value ?? 0 })}
                        mode="currency"
                        currency="ETB" // Matches Manager datagrid layout context
                        locale="en-US"
                        min={0}
                        maxFractionDigits={0}
                        placeholder="Enter strategic pool limit"
                        className={classNames({ 'p-invalid': submitted && (!localCall.budget || localCall.budget <= 0) })}
                    />
                    {submitted && (!localCall.budget || localCall.budget <= 0) && (
                        <small className="p-error font-semibold block mt-1">A valid operational budget is required.</small>
                    )}
                </div>

                <div className="field">
                    <label htmlFor="description" className="font-bold">Description / Instructions</label>
                    <InputTextarea
                        id="description"
                        value={localCall.description ?? ''}
                        onChange={(e) => setLocalCall({ ...localCall, description: e.target.value })}
                        rows={4}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveCall;