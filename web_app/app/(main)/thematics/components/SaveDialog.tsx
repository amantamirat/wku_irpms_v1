'use client';
import { useAuth } from '@/contexts/auth-context';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Organization, OrgnUnit } from '../../organizations/models/organization.model';
import { ThematicApi } from '../api/thematic.api';
import { Thematic, ThemeLevel, ThemeType, validateThematic } from '../models/thematic.model';
import { useDirectorate } from '@/contexts/DirectorateContext';


interface SaveDialogProps {
    visible: boolean;
    thematic: Thematic;
    onComplete?: (savedThematic: Thematic) => void;
    onHide: () => void;
}

const SaveDialog = ({ visible, thematic, onComplete, onHide }: SaveDialogProps) => {

    const toast = useRef<Toast>(null);

    const [localThematic, setLocalThematic] = useState<Thematic>({ ...thematic });
    const [submitted, setSubmitted] = useState(false);
    const { directorates } = useDirectorate();

    useEffect(() => {
        setLocalThematic({ ...thematic });
    }, [thematic]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalThematic({ ...thematic });
    };

    const saveThematic = async () => {
        setSubmitted(true);
        try {
            const validation = validateThematic(localThematic);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            let saved = localThematic._id
                ? await ThematicApi.updateThematic(localThematic)
                : await ThematicApi.createThematic(localThematic);
            saved = {
                ...saved,
                directorate: localThematic.directorate
            };
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Thematic saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Thematic',
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
            <Button label="Save" icon="pi pi-check" text onClick={saveThematic} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localThematic._id ? 'Edit Thematic' : 'New Thematic'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Directorate Selector */}
                <div className="field">
                    <label htmlFor="directorate">Directorate</label>
                    <Dropdown
                        id="directorate"
                        value={localThematic.directorate}
                        options={directorates}
                        optionLabel="name"
                        onChange={(e) => setLocalThematic({ ...localThematic, directorate: e.value })}
                        placeholder="Select Directorate"
                        className={classNames({ 'p-invalid': submitted && !localThematic.directorate })}
                    />
                </div>

                {/* Title Field */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localThematic.title}
                        onChange={(e) => setLocalThematic({ ...localThematic, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localThematic.title })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="type">Type</label>
                    <Dropdown
                        id="type"
                        value={localThematic.type}
                        options={Object.values(ThemeType).map((g) => ({
                            label: g,
                            value: g,
                        }))}
                        onChange={(e) => setLocalThematic({ ...localThematic, type: e.value })}
                        placeholder="Select Type"
                        className={classNames({
                            'p-invalid': submitted && !localThematic.type,
                        })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="level">Level</label>
                    <Dropdown
                        id="level"
                        value={localThematic.level}
                        options={Object.values(ThemeLevel).map((g) => ({
                            label: g,
                            value: g,
                        }))}
                        onChange={(e) => setLocalThematic({ ...localThematic, level: e.value })}
                        placeholder="Select Depth"
                        className={classNames({
                            'p-invalid': submitted && !localThematic.level,
                        })}
                    />
                </div>

                {/* Description Field */}
                <div className="field">
                    <label htmlFor="description">Description</label>
                    <InputTextarea
                        id="description"
                        value={localThematic.description ?? ''}
                        onChange={(e) => setLocalThematic({ ...localThematic, description: e.target.value })}
                        rows={4}
                        cols={30}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveDialog;
