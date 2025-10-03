'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useCallback, useEffect, useState } from 'react';
import { CalendarApi } from '../../calendars/api/calendar.api';
import { Calendar, CalendarStatus } from '../../calendars/models/calendar.model';
import { EvaluationApi } from '../../evals/api/eval.api';
import { Evaluation } from '../../evals/models/eval.model';
import { GrantApi } from '../../grants/api/grant.api';
import { Grant } from '../../grants/models/grant.model';
import { ThemeApi } from '../../themes/api/theme.api';
import { Theme } from '../../themes/models/theme.model';
import { Call, validateCall } from '../models/call.model';
import CallForm from './CallForm';

interface SaveDialogProps {
    visible: boolean;
    call: Call;
    setCall: (call: Call) => void;
    onSave: () => void;
    onHide: () => void;
}

const SaveDialog = (props: SaveDialogProps) => {
    const { visible, call, setCall, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [grants, setGrants] = useState<Grant[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [themes, setThemes] = useState<Theme[]>([]);

    useEffect(() => {
        const fetchCalendars = async () => {
            const data = await CalendarApi.getCalendars({ status: CalendarStatus.active });
            setCalendars(data);
        };
        if (!call.calendar)
            fetchCalendars();
    }, []);


    const fetchGrants = useCallback(async () => {
        const data = await GrantApi.getGrants({ directorate: (call.directorate as any)._id });
        setGrants(data);
    }, [(call.directorate as any)._id]);

    const fetchEvaluations = useCallback(async () => {
        const data = await EvaluationApi.getEvaluations({ directorate: (call.directorate as any)._id });
        setEvaluations(data);
    }, [(call.directorate as any)._id]);

    const fetchThemes = useCallback(async () => {
        const data = await ThemeApi.getThemes({ directorate: (call.directorate as any)._id });
        setThemes(data);
    }, [(call.directorate as any)._id]);

    useEffect(() => {
        fetchGrants();
        fetchEvaluations();
        fetchThemes();
    }, [fetchGrants, fetchEvaluations, fetchThemes]);


    const save = async () => {
        setSubmitted(true);
        const result = validateCall(call);
        if (!result.valid) {
            setErrorMessage(result.message);
            return;
        }
        setErrorMessage(undefined);
        onSave();
    };

    const hide = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        //setShowCalendars(false);
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={save} />
        </>
    );

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible]);


    return (
        <Dialog
            visible={visible}
            style={{ width: '600px', minHeight: '600px' }}
            header={call._id ? 'Edit Call' : 'New Call'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
            maximizable
        >

            <CallForm call={call} setCall={setCall}
                calendars={calendars}
                grants={grants}
                evaluations={evaluations}
                themes={themes}
                submitted={submitted} />
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}

        </Dialog>
    );
}

export default SaveDialog;


