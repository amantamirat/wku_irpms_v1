import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Phase } from "../../models/project.model";


interface AddPhaseDialogProps {
    phase: Phase;
    setPhase: (phase: Phase) => void;
    visible: boolean;
    onAdd: () => void;
    onHide: () => void;
}

export default function AddPhaseDialog({ phase, setPhase, visible, onAdd, onHide }: AddPhaseDialogProps) {

    const updateField = (field: keyof Phase, value: any) => {
        setPhase({ ...phase, [field]: value });
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Add" icon="pi pi-check" text onClick={onAdd} />
        </>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: "600px" }}
            header="Add Phase"
            modal
            className="p-fluid"
            footer={footer}
            onHide={onHide}
        >
            <div className="field">
                <label htmlFor="order">Order</label>
                <InputNumber
                    id="order"
                    value={phase.order}
                    onValueChange={(e) => updateField("order", e.value ?? 0)}
                    min={1}
                    placeholder="Enter phase order"
                />
            </div>

            <div className="field">
                <label htmlFor="duration">Duration (days)</label>
                <InputNumber
                    id="duration"
                    value={phase.duration}
                    onValueChange={(e) => updateField("duration", e.value ?? 0)}
                    min={1}
                    placeholder="Enter duration in days"
                />
            </div>

            <div className="field">
                <label htmlFor="budget">Budget (ETB)</label>
                <InputNumber
                    id="budget"
                    value={phase.budget}
                    onValueChange={(e) => updateField("budget", e.value ?? 0)}
                    mode="currency"
                    currency="ETB"
                    locale="en-ET"
                    placeholder="Enter budget"
                />
            </div>

            <div className="field">
                <label htmlFor="description">Description</label>
                <InputTextarea
                    id="description"
                    rows={3}
                    value={phase.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    autoResize
                    placeholder="Enter description (optional)"
                />
            </div>
        </Dialog>
    );
}
