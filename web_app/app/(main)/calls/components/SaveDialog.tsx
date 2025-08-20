'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Call, validateCall } from '../models/call.model';
import { Calendar } from '../../calendars/models/calendar.model';
import { InputTextarea } from 'primereact/inputtextarea';
import { Editor } from 'primereact/editor';



interface SaveDialogProps {
    visible: boolean;
    call: Call;
    calendars?: Calendar[];
    onChange: (call: Call) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, call, calendars, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();


    const [internalDescription, setInternalDescription] = useState(call.description || '');
    const [isEditorReady, setIsEditorReady] = useState(false);
    const editorRef = useRef<any>(null);

    // Sync internal description with call.description when dialog opens
    useEffect(() => {
        if (visible) {
            setInternalDescription(call.description || '');
            setIsEditorReady(false);

            // Small delay to ensure editor is mounted before trying to set content
            const timer = setTimeout(() => {
                setIsEditorReady(true);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [visible, call.description]);

    // Programmatically set editor content when it's ready
    useEffect(() => {
        if (isEditorReady && editorRef.current && internalDescription) {
            try {
                const quill = (editorRef.current as any).getQuill();
                if (quill) {
                    quill.root.innerHTML = internalDescription;
                }
            } catch (error) {
                console.error('Error setting editor content:', error);
            }
        }
    }, [isEditorReady, internalDescription]);

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


    const handleEditorChange = (e: any) => {
        const newDescription = e.htmlValue || '';
        setInternalDescription(newDescription);
        onChange({ ...call, description: newDescription });
    };

    return (
        <Dialog
            visible={visible}
            style={{ width: '800px', minHeight: '600px' }}
            header={call._id ? 'Edit Call' : 'Create New Call'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
            maximizable
        >

            <div className="field">
                <label htmlFor="calendar">Reserach Calendar</label>
                <Dropdown
                    id="calendar"
                    value={call.calendar}
                    options={calendars}
                    onChange={(e) =>
                        onChange({
                            ...call,
                            calendar: e.value,
                        })
                    }
                    optionLabel="year"
                    placeholder="Select a Calendar"
                    required
                    className={classNames({ 'p-invalid': submitted && !call.calendar })}
                />
            </div>
            <div className="field">
                <label htmlFor="title">Title</label>
                <InputText
                    id="title"
                    value={call.title}
                    onChange={(e) => onChange({ ...call, title: e.target.value })}
                    required
                    autoFocus
                    className={classNames({ 'p-invalid': submitted && !call.title })}
                />
            </div>

            <div className="field">
                <label htmlFor="description">Description / Notes</label>
                {visible && ( // Only render editor when dialog is visible
                    <Editor
                        ref={editorRef}
                        id="description"
                        value={internalDescription}
                        onTextChange={handleEditorChange}
                        style={{ height: '200px' }}
                        onLoad={() => {
                            // Set content after editor is fully loaded
                            if (editorRef.current && internalDescription) {
                                setTimeout(() => {
                                    const quill = editorRef.current.getQuill();
                                    if (quill) {
                                        quill.root.innerHTML = internalDescription;
                                    }
                                }, 50);
                            }
                        }}
                    />
                )}
            </div>

            <div className="field">
                <label htmlFor="deadline">Deadline</label>
                <PrimeCalendar
                    id="deadline"
                    value={call.deadline ? new Date(call.deadline) : undefined}
                    onChange={(e) => onChange({ ...call, deadline: e.value! })}
                    dateFormat="yy-mm-dd"
                    showIcon
                    className={classNames({ 'p-invalid': submitted && !call.deadline })}
                    required
                />
            </div>


            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
