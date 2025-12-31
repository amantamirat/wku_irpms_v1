'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { OptionApi } from '../api/option.api';
import { Option, validateOption } from '../models/option.model';

interface SaveOptionProps {
    visible: boolean;
    //criterion: Criterion;
    option: Option;
    onComplete?: (saved: Option) => void;
    onHide: () => void;
}

const SaveOption = ({ visible, option, onComplete, onHide }: SaveOptionProps) => {
    const toast = useRef<Toast>(null);
    const [localOption, setLocalOption] = useState<Option>({ ...option });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalOption({ ...option });
    }, [option]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalOption({ ...option });
    };

    const saveOption = async () => {
        setSubmitted(true);
        try {
            const validation = validateOption(localOption);
            if (!validation.valid) throw new Error(validation.message);

            let saved = localOption._id
                ? await OptionApi.updateOption(localOption)
                : await OptionApi.createOption(localOption);

            saved = {
                ...saved,
                criterion: localOption.criterion
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Option saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 800);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save option',
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
            <Button label="Save" icon="pi pi-check" text onClick={saveOption} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={localOption._id ? 'Edit Option' : 'New Option'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Option Title */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localOption.title || ''}
                        onChange={(e) => setLocalOption({ ...localOption, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localOption.title })}
                    />
                </div>

                {/* Option Value */}
                <div className="field">
                    <label htmlFor="value">Value</label>
                    <InputNumber
                        id="value"
                        value={localOption.score}
                        onValueChange={(e) => setLocalOption({ ...localOption, score: e.value || 0 })}
                        required
                        mode="decimal"
                        min={0}
                        className={classNames({ 'p-invalid': submitted && (localOption.score === undefined || localOption.score < 0) })}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveOption;
