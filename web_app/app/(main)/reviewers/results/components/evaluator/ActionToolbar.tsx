import { Button } from 'primereact/button';

interface ActionToolbarProps {
    onSave: () => void;
    onCancel: () => void;
    isDirty: boolean;
    loading: boolean;
}

export const ActionToolbar = ({ onSave, onCancel, isDirty, loading }: ActionToolbarProps) => {
    return (
        <div className="sticky bottom-0 left-0 w-full surface-section border-top-1 border-300 p-3 flex justify-content-end gap-3 z-5 shadow-6">
            <Button label="Discard Changes" icon="pi pi-refresh" className="p-button-text p-button-secondary" onClick={onCancel} disabled={!isDirty || loading} />
            <Button label="Submit Evaluation" icon="pi pi-send" className="p-button-primary px-5" onClick={onSave} loading={loading} disabled={!isDirty} />
        </div>
    );
};