import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { IOtherActivityDetails } from '../../models/phase-activity.model';

interface Props {
    details: IOtherActivityDetails;
    onChange: (details: IOtherActivityDetails) => void;
    disabled?: boolean;
}

export const OtherDetailForm = ({ details, onChange, disabled }: Props) => {
    return (
        <div className="grid">
            <div className="field col-12">
                <label className="font-bold text-sm block mb-2">Purpose</label>
                <InputText
                    value={details.purpose || ''}
                    onChange={(e) => onChange({ ...details, purpose: e.target.value })}
                    placeholder="Purpose of other activity"
                    disabled={disabled}
                />
            </div>
            <div className="field col-12">
                <label className="font-bold text-sm block mb-2">Additional Notes</label>
                <InputTextarea
                    rows={2}
                    value={details.additionalNotes || ''}
                    onChange={(e) => onChange({ ...details, additionalNotes: e.target.value })}
                    placeholder="Any specific comments..."
                    disabled={disabled}
                />
            </div>
        </div>
    );
};