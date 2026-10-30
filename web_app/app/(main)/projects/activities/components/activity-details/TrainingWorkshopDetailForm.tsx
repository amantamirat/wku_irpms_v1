import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { ITrainingWorkshopDetails } from '../../models/phase-activity.model';

interface Props {
    details: ITrainingWorkshopDetails;
    onChange: (details: ITrainingWorkshopDetails) => void;
    disabled?: boolean;
}

export const TrainingWorkshopDetailForm = ({ details, onChange, disabled }: Props) => {
    return (
        <div className="grid">
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Target Audience</label>
                <InputText
                    value={details.targetAudience || ''}
                    onChange={(e) => onChange({ ...details, targetAudience: e.target.value })}
                    placeholder="e.g., Local Farmers, Researchers"
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Venue</label>
                <InputText
                    value={details.venue || ''}
                    onChange={(e) => onChange({ ...details, venue: e.target.value })}
                    placeholder="e.g., University Hall A"
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Facilitator / Trainer</label>
                <InputText
                    value={details.facilitator || ''}
                    onChange={(e) => onChange({ ...details, facilitator: e.target.value })}
                    placeholder="e.g., Dr. John Doe"
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-3">
                <label className="font-bold text-sm block mb-2">Target Participants</label>
                <InputNumber
                    value={details.participantsTarget ?? null}
                    onValueChange={(e) => onChange({ ...details, participantsTarget: e.value ?? undefined })}
                    min={0}
                    useGrouping={false}
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-3">
                <label className="font-bold text-sm block mb-2">Actual Participants</label>
                <InputNumber
                    value={details.participantsActual ?? null}
                    onValueChange={(e) => onChange({ ...details, participantsActual: e.value ?? undefined })}
                    min={0}
                    useGrouping={false}
                    disabled={disabled}
                />
            </div>
        </div>
    );
};