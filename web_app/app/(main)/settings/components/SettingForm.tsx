'use client';

import { FormEvent, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { MultiSelect } from 'primereact/multiselect';
import { classNames } from 'primereact/utils';
import { FILE_TYPE_OPTIONS, Setting, SettingKey, validateSetting } from '../models/setting.model';
import { ItemFormRenderProps } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';

const SettingForm = ({ item, saving, formId, onSubmit }: ItemFormRenderProps<Setting>) => {
    const toast = useToast();

    const [initial] = useState<Setting>(() => item ?? ({} as Setting));
    const [localSetting, setLocalSetting] = useState<Setting>({ ...initial });
    const [submitted, setSubmitted] = useState(false);

    const valueMissing = localSetting.value === undefined || localSetting.value === '' || localSetting.value === null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (saving) return;

        const validation = validateSetting(localSetting);
        if (!validation.valid) {
            toast.error(validation.message || 'Validation failed', 'Validation Error');
            return;
        }

        if (!localSetting.key) {
            toast.error("Cannot update a setting without a valid key.", 'Validation Error');
            return;
        }

        // ItemManager handles API updates and success/error toasts
        await onSubmit({
            ...localSetting,
        });
    };

    const renderValueInput = () => {
        switch (localSetting.type) {
            case 'number':
                return (
                    <InputNumber
                        id="value"
                        value={localSetting.value as number}
                        disabled={saving}
                        onValueChange={(e) => setLocalSetting({ ...localSetting, value: e.value })}
                        className={classNames({ 'p-invalid': submitted && valueMissing })}
                    />
                );
            case 'boolean':
                return (
                    <div className="flex align-items-center mt-2">
                        <InputSwitch
                            id="value"
                            checked={!!localSetting.value}
                            disabled={saving}
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
                                disabled={saving}
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
                        disabled={saving}
                        onChange={(e) => setLocalSetting({ ...localSetting, value: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && valueMissing })}
                    />
                );
        }
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            <div className="field mb-3">
                <label className="font-bold text-primary block mb-2">
                    {localSetting.key?.toUpperCase().replace(/_/g, ' ')}
                </label>
                <p className="text-sm text-600 mb-4 bg-gray-100 p-2 border-round">
                    {localSetting.description || 'No description provided.'}
                </p>
            </div>

            <div className="field mb-4">
                <label htmlFor="value" className="font-semibold block mb-2">Value</label>
                {renderValueInput()}
                {submitted && valueMissing && (
                    <small className="p-error block mt-1">A valid value is required.</small>
                )}
            </div>

            <div className="mt-4 p-2 border-top-1 surface-border">
                <small className="text-500">
                    Type: <span className="font-mono">{localSetting.type}</span>
                </small>
            </div>
        </form>
    );
};

export default SettingForm;