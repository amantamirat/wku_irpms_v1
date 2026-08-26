import { Button } from 'primereact/button';

interface ActionToolbarProps {
    onSave: () => void;
    onCancel: () => void;
    onSubmit: () => void;
    isDirty: boolean;
    loading: boolean;
    isSubmittable: boolean;
}

export const ActionToolbar = ({
    onSave,
    onCancel,
    onSubmit,
    isDirty,
    loading,
    isSubmittable
}: ActionToolbarProps) => {
    return (
        <div className="sticky bottom-0 left-0 w-full surface-section border-top-1 border-300 p-3 flex justify-content-end gap-3 z-5 shadow-6">
            <Button
                label="Discard Changes"
                icon="pi pi-refresh"
                className="p-button-text p-button-secondary"
                onClick={onCancel}
                disabled={!isDirty || loading}
            />
            <Button
                label="Save Draft"
                icon="pi pi-save"
                className="p-button-outlined p-button-primary px-4"
                onClick={onSave}
                loading={loading}
                disabled={!isDirty}
            />
            {isSubmittable && <Button
                label="Submit Evaluation"
                icon="pi pi-check-circle"
                className="p-button-success px-4"
                onClick={onSubmit}
                loading={loading}
                disabled={isDirty || !isSubmittable}
            />}
        </div>
    );
};