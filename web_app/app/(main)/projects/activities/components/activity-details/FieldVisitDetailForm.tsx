import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { IFieldVisitDetails } from '../../models/phase-activity.model';

interface Props {
    details: IFieldVisitDetails;
    onChange: (details: IFieldVisitDetails) => void;
    disabled?: boolean;
}

export const FieldVisitDetailForm = ({ details, onChange, disabled }: Props) => {
    return (
        <div className="grid">
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Site / Location Name</label>
                <InputText
                    value={details.location?.name || ''}
                    onChange={(e) => onChange({ ...details, location: { ...details.location, name: e.target.value } })}
                    placeholder="e.g., Regional Agricultural Hub"
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Target Sites Count</label>
                <InputNumber
                    value={details.sitesTarget ?? null}
                    onValueChange={(e) => onChange({ ...details, sitesTarget: e.value ?? undefined })}
                    min={0}
                    useGrouping={false}
                    disabled={disabled}
                />
            </div>
            <div className="field col-12">
                <label className="font-bold text-sm block mb-2">Purpose</label>
                <InputText
                    value={details.purpose || ''}
                    onChange={(e) => onChange({ ...details, purpose: e.target.value })}
                    placeholder="Inspection and verification of project milestone"
                    disabled={disabled}
                />
            </div>
        </div>
    );
};