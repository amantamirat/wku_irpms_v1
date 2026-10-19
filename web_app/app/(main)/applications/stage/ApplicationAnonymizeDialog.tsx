
'use client';

import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';

interface ApplicationAnonymizeDialogProps {
    visible: boolean;
    onHide: () => void;
    identifiers?: string[];
    onAnonymize: (identifiers: string[]) => void | Promise<void>;
    saving: boolean;
    errorMessage: string | null;
}

export const ApplicationAnonymizeDialog = ({
    visible,
    onHide,
    identifiers = [],
    onAnonymize,
    saving,
    errorMessage
}: ApplicationAnonymizeDialogProps) => {
    const [identifierText, setIdentifierText] = useState('');

    // Load the saved identifiers whenever the dialog opens.
    useEffect(() => {
        if (visible) {
            setIdentifierText(identifiers.join('\n'));
        }
    }, [visible, identifiers]);

    const handleAnonymize = async () => {
        const normalizedIdentifiers = [
            ...new Set(
                identifierText
                    .split('\n')
                    .map(identifier => identifier.trim())
                    .filter(Boolean)
            )
        ];

        await onAnonymize(normalizedIdentifiers);
    };

    return (
        <Dialog
            header="Anonymize Application Document"
            visible={visible}
            style={{ width: '550px', maxWidth: '95vw' }}
            onHide={() => {
                if (!saving) onHide();
            }}
            closable={!saving}
            closeOnEscape={!saving}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        className="p-button-text p-button-sm"
                        onClick={onHide}
                        disabled={saving}
                    />

                    <Button
                        label="Anonymize"
                        icon="pi pi-eye-slash"
                        className="p-button-sm"
                        severity="warning"
                        loading={saving}
                        onClick={handleAnonymize}
                    />
                </div>
            }
        >
            <div className="flex flex-column gap-3 pt-2">
                <span className="text-sm text-600">
                    The system automatically detects member names, email
                    addresses, phone numbers, and ORCIDs. Add any additional
                    identifying text that should be redacted from the document.
                </span>

                {errorMessage && (
                    <Message
                        severity="error"
                        text={errorMessage}
                        className="w-full"
                    />
                )}

                <div className="flex flex-column gap-2">
                    <label
                        htmlFor="manualIdentifiers"
                        className="text-sm font-semibold text-900"
                    >
                        Additional Identifiers
                    </label>

                    <InputTextarea
                        id="manualIdentifiers"
                        value={identifierText}
                        onChange={(e) => setIdentifierText(e.target.value)}
                        rows={6}
                        autoResize
                        className="w-full"
                        placeholder={
                            'Wolkite University\nDepartment of Computer Science\nOther identifying text'
                        }
                        disabled={saving}
                    />

                    <small className="text-500">
                        Enter one identifier per line. Previously saved
                        identifiers are loaded automatically. Remove any
                        identifier you no longer want to redact.
                    </small>
                </div>
            </div>
        </Dialog>
    );
};
