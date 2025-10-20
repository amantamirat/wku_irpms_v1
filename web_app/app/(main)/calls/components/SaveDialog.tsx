'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Toast } from 'primereact/toast';
import { CalendarApi } from '../../calendars/api/calendar.api';
import { Calendar, CalendarStatus } from '../../calendars/models/calendar.model';
import { EvaluationApi } from '../../evals/api/evaluation.api';
import { Evaluation } from '../../evals/models/evaluation.model';
import { GrantApi } from '../../grants/api/grant.api';
import { Grant } from '../../grants/models/grant.model';
import { ThemeApi } from '../../themes/api/theme.api';
import { Theme } from '../../themes/models/theme.model';
import { Call, validateCall } from '../models/call.model';
import CallForm from './CallForm';
import { CallApi } from '../api/call.api';

interface SaveDialogProps {
    visible: boolean;
    call: Call;
    onHide: () => void;
    onComplete?: (savedCall: Call) => void;
}

const SaveDialog = ({ visible, call, onHide, onComplete }: SaveDialogProps) => {
    const toast = useRef<Toast>(null);

    const [localCall, setLocalCall] = useState<Call>({ ...call });
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [grants, setGrants] = useState<Grant[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [themes, setThemes] = useState<Theme[]>([]);

    // Reset local copy when dialog opens
    useEffect(() => {
        if (visible) {
            setLocalCall({ ...call });
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible, call]);

    // Fetch calendars once (if no calendar selected)
    useEffect(() => {
        const fetchCalendars = async () => {
            const data = await CalendarApi.getCalendars({ status: CalendarStatus.active });
            setCalendars(data);
        };
        if (!localCall.calendar) fetchCalendars();
    }, [localCall.calendar]);

    const directorateId = (localCall.directorate as any)?._id;

    const fetchGrants = useCallback(async () => {
        if (!directorateId) return;
        const data = await GrantApi.getGrants({ directorate: directorateId });
        setGrants(data);
    }, [directorateId]);

    const fetchEvaluations = useCallback(async () => {
        if (!directorateId) return;
        const data = await EvaluationApi.getEvaluations({ directorate: directorateId });
        setEvaluations(data);
    }, [directorateId]);

    const fetchThemes = useCallback(async () => {
        if (!directorateId) return;
        const data = await ThemeApi.getThemes({ directorate: directorateId });
        setThemes(data);
    }, [directorateId]);

    useEffect(() => {
        fetchGrants();
        fetchEvaluations();
        fetchThemes();
    }, [fetchGrants, fetchEvaluations, fetchThemes]);

    // Save handler with API
    const save = async () => {
        try {
            setSubmitted(true);
            const validation = validateCall(localCall);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Call;
            if (localCall._id) {
                saved = await CallApi.updateCall(localCall);
            } else {
                saved = await CallApi.createCall(localCall);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Call saved successfully',
                life: 2000,
            });

            if (onComplete) onComplete(saved);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save call',
                detail: err.message || '' + err,
                life: 2000,
            });
        }
    };

    const hide = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={save} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localCall._id ? 'Edit Call' : 'New Call'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
                maximizable
            >
                <CallForm
                    call={localCall}
                    setCall={setLocalCall}
                    calendars={calendars}
                    grants={grants}
                    evaluations={evaluations}
                    themes={themes}
                    submitted={submitted}
                />
                {errorMessage && <small className="p-error">{errorMessage}</small>}
            </Dialog>
        </>
    );
};

export default SaveDialog;
