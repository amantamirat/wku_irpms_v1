'use client';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { FILE_TYPE_OPTIONS, Setting, SettingKey, validateSetting } from '../models/setting.model';
import { SettingApi } from '../api/setting.api';
import { MultiSelect } from 'primereact/multiselect';

const SaveSetting = (props: EntitySaveDialogProps<Setting>) => {
    const { visible, item, onComplete, onHide } = props;

    const toast = useRef<Toast>(null);
    const [submitted, setSubmitted] = useState(false);
    const [localSetting, setLocalSetting] = useState<Setting>({ ...item });

    useEffect(() => {
        setLocalSetting({ ...item });
    }, [item]);

    const saveSetting = async () => {
        setSubmitted(true);

        try {
            const validation = validateSetting(localSetting);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            // As per your request: Update Only logic
            if (!localSetting.key) {
                throw new Error("Cannot update a setting without a valid key.");
            }

            const saved = await SettingApi.update(localSetting);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Configuration updated successfully',
                life: 2000,
            });

            if (onComplete) {
                setTimeout(() => onComplete(saved as Setting), 500);
            }
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: err.message || String(err),
                life: 3000,
            });
        }
    };

    /**
     * Renders the appropriate input field based on the setting type
     */
    const renderValueInput = () => {
        switch (localSetting.type) {
            case 'number':
                return (
                    <InputNumber
                        id="value"
                        value={localSetting.value}
                        onValueChange={(e) => setLocalSetting({ ...localSetting, value: e.value })}
                        className={classNames({ 'p-invalid': submitted && localSetting.value === null })}
                    />
                );
            case 'boolean':
                return (
                    <div className="flex align-items-center mt-2">
                        <InputSwitch
                            id="value"
                            checked={!!localSetting.value}
                            onChange={(e) => setLocalSetting({ ...localSetting, value: e.value })}
                        />
                        <span className="ml-2">{localSetting.value ? 'Enabled' : 'Disabled'}</span>
                    </div>
                );
            case 'json':
                if (Array.isArray(localSetting.value)) {
                    if (localSetting.key === SettingKey.ALLOWED_FILE_TYPES) {
                        return (
                            <MultiSelect
                                id="value"
                                value={localSetting.value || []}
                                options={FILE_TYPE_OPTIONS}
                                onChange={(e) => setLocalSetting({ ...localSetting, value: e.value })}
                                optionLabel="name"
                                optionValue="value"
                                placeholder="Select allowed formats"
                                display="chip"
                                filter
                                className={classNames({
                                    'p-invalid': submitted && (!localSetting.value || localSetting.value.length === 0)
                                })}
                            />
                        );
                    }
                }
                return (
                    <small className="text-yellow-600 italic">
                        JSON settings are currently read-only via this dialog.
                    </small>
                );
            default: // string
                return (
                    <InputText
                        id="value"
                        value={localSetting.value || ''}
                        onChange={(e) => setLocalSetting({ ...localSetting, value: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localSetting.value })}
                    />
                );
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Update" icon="pi pi-check" text onClick={saveSetting} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header="System Configuration"
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="field">
                    <label className="font-bold text-primary block mb-2">
                        {localSetting.key?.toUpperCase().replace(/_/g, ' ')}
                    </label>
                    <p className="text-sm text-600 mb-4 bg-gray-100 p-2 border-round">
                        {localSetting.description || 'No description provided.'}
                    </p>
                </div>

                <div className="field">
                    <label htmlFor="value" className="font-semibold">Value</label>
                    {renderValueInput()}
                    {submitted && (localSetting.value === undefined || localSetting.value === '') && (
                        <small className="p-error">A valid value is required.</small>
                    )}
                </div>

                <div className="mt-4 p-2 border-top-1 surface-border">
                    <small className="text-500">
                        Type: <span className="font-mono">{localSetting.type}</span>
                    </small>
                </div>
            </Dialog>
        </>
    );
};

export default SaveSetting;