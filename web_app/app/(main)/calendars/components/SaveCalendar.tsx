'use client';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';

import { Calendar, validateCalendar } from '../models/calendar.model';
import { CalendarApi } from '../api/calendar.api';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveCalendar = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Calendar>) => {

    const toast = useRef<Toast>(null);
    const [localCalendar, setLocalCalendar] = useState<Calendar>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalCalendar({ ...item });
    }, [item]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalCalendar({ ...item });
    };

    const saveCalendar = async () => {
        setSubmitted(true);

        try {
            const validation = validateCalendar(localCalendar);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            const saved = localCalendar._id
                ? await CalendarApi.update(localCalendar)
                : await CalendarApi.create(localCalendar);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Calendar saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Calendar',
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
            <Button label="Save" icon="pi pi-check" text onClick={saveCalendar} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={localCalendar._id ? 'Edit Academic Calendar' : 'New Academic Calendar'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >

                <div className="field">
                    <label htmlFor="year">Year</label>
                    <InputNumber
                        id="year"
                        value={localCalendar.year}
                        onValueChange={(e) =>
                            setLocalCalendar({ ...localCalendar, year: e.value ?? 0 })
                        }
                        useGrouping={false}
                        showButtons
                        className={classNames({
                            'p-invalid': submitted && !localCalendar.year
                        })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="startDate">Start Date</label>
                    <PrimeCalendar
                        id="startDate"
                        value={localCalendar.startDate ? new Date(localCalendar.startDate) : undefined}
                        onChange={(e) =>
                            setLocalCalendar({ ...localCalendar, startDate: e.value ?? null })
                        }
                        dateFormat="yy-mm-dd"
                        showIcon
                        className={classNames({
                            'p-invalid': submitted && !localCalendar.startDate
                        })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="endDate">End Date</label>
                    <PrimeCalendar
                        id="endDate"
                        value={localCalendar.endDate ? new Date(localCalendar.endDate) : undefined}
                        onChange={(e) =>
                            setLocalCalendar({ ...localCalendar, endDate: e.value ?? null })
                        }
                        dateFormat="yy-mm-dd"
                        showIcon
                        className={classNames({
                            'p-invalid': submitted && !localCalendar.endDate
                        })}
                    />
                </div>

            </Dialog>
        </>
    );
};

export default SaveCalendar;