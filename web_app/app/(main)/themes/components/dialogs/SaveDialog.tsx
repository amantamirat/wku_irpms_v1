'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Theme, ThemeLevel, ThemeType, validateTheme } from '../../models/theme.model';
import { ThemeApi } from '../../api/theme.api';
import { useAuth } from '@/contexts/auth-context';
import { Organization, OrganizationalUnit } from '@/app/(main)/organizations/models/organization.model';


interface SaveDialogProps {
    visible: boolean;
    theme: Theme;
    onComplete?: (savedTheme: Theme) => void;
    onHide: () => void;
}

const SaveDialog = ({ visible, theme, onComplete, onHide }: SaveDialogProps) => {
    const { getOrganizationsByType } = useAuth();
    const toast = useRef<Toast>(null);
    const [localTheme, setLocalTheme] = useState<Theme>({ ...theme });
    const [submitted, setSubmitted] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const isThematicArea = localTheme.type === ThemeType.thematic_area;

    useEffect(() => {
        setLocalTheme({ ...theme });
    }, [theme]);


    useEffect(() => {
        const fetchDirectorates = async () => {
            if (!isThematicArea) return;
            try {
                const data = getOrganizationsByType([OrganizationalUnit.Directorate]);
                setOrganizations(data);
            } catch (err) {
                console.error('Failed to fetch directorates', err);
            }
        };
        fetchDirectorates();
    }, [isThematicArea]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalTheme({ ...theme });
    };

    const saveTheme = async () => {
        setSubmitted(true);
        try {
            const result = validateTheme(localTheme);
            if (!result.valid) {
                throw new Error(result.message);
            }

            const saved = localTheme._id
                ? await ThemeApi.updateTheme(localTheme)
                : await ThemeApi.createTheme(localTheme);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Theme saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Theme',
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
            <Button label="Save" icon="pi pi-check" text onClick={saveTheme} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={localTheme._id ? `Edit ${localTheme.type}` : `New ${localTheme.type}`}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {isThematicArea && <>
                    <div className="field">
                        <label htmlFor="directorate">Directorate</label>
                        <Dropdown
                            id="directorate"
                            value={localTheme.directorate}
                            options={organizations}
                            optionLabel="name"
                            onChange={(e) => setLocalTheme({ ...localTheme, directorate: e.value })}
                            placeholder="Select Directorate"
                            className={classNames({ 'p-invalid': submitted && !localTheme.directorate })}
                        />
                    </div>
                </>}

                {/* Title Field */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localTheme.title}
                        onChange={(e) => setLocalTheme({ ...localTheme, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localTheme.title })}
                    />
                </div>

                {/* Priority or Level Field */}
                <div className="field">
                    {isThematicArea ? (
                        localTheme._id ? null : (
                            <>
                                <label htmlFor="level">Level</label>
                                <Dropdown
                                    id="level"
                                    value={localTheme.level}
                                    options={Object.values(ThemeLevel).map((g) => ({
                                        label: g,
                                        value: g,
                                    }))}
                                    onChange={(e) => setLocalTheme({ ...localTheme, level: e.value })}
                                    placeholder="Select Level"
                                    className={classNames({
                                        'p-invalid': submitted && !localTheme.level,
                                    })}
                                />
                            </>
                        )
                    ) : (
                        <>
                            <label htmlFor="priority">
                                {isThematicArea ? 'Level' : 'Priority'}
                            </label>
                            <InputNumber
                                id="priority"
                                value={localTheme.priority as number | null}
                                onChange={(e) =>
                                    setLocalTheme({ ...localTheme, priority: e.value || 0 })
                                }
                                required
                                className={classNames({
                                    'p-invalid':
                                        submitted &&
                                        !isThematicArea &&
                                        localTheme.priority == null,
                                })}
                            />
                        </>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default SaveDialog;
