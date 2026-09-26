// ReviewerAssignerDialog.tsx
'use client';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';

interface ReviewerAssignerDialogProps {
    visible: boolean;
    onHide: () => void;
    users: any[];
    selectedUserId: string | null;
    setSelectedUserId: (id: string | null) => void;
    onSave: () => void;
    saving: boolean;
    errorMessage: string | null;
}

export const ReviewerAssignerDialog = ({
    visible,
    onHide,
    users,
    selectedUserId,
    setSelectedUserId,
    onSave,
    saving,
    errorMessage
}: ReviewerAssignerDialogProps) => {
    return (
        <Dialog
            header="Manage Reviewer Assigner"
            visible={visible}
            style={{ width: '400px' }}
            onHide={onHide}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        className="p-button-text p-button-sm"
                        onClick={onHide}
                    />
                    <Button
                        label="Save"
                        icon="pi pi-check"
                        className="p-button-sm"
                        loading={saving}
                        onClick={onSave}
                    />
                </div>
            }
        >
            <div className="flex flex-column gap-3 pt-2">
                <span className="text-sm text-600">
                    Select a user responsible for assigning evaluators/reviewers to this application. You can also clear the assignment if needed.
                </span>

                {/* Error Message Box */}
                {errorMessage && (
                    <div className="p-3 bg-red-50 border-1 border-red-200 border-round text-red-700 text-xs flex align-items-center gap-2">
                        <i className="pi pi-exclamation-circle text-red-500 text-base"></i>
                        <span>{errorMessage}</span>
                    </div>
                )}

                <div className="flex flex-column gap-1">
                    <label className="text-xs font-bold text-900 uppercase">Reviewer Assigner</label>
                    <Dropdown
                        value={selectedUserId}
                        options={users}
                        optionLabel="name"
                        optionValue="_id"
                        placeholder="Select a user (or clear)"
                        filter
                        showClear
                        className="w-full"
                        onChange={(e) => setSelectedUserId(e.value)}
                    />
                </div>
            </div>
        </Dialog>
    );
};