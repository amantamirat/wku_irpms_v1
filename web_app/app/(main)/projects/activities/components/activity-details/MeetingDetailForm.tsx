import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { IMeetingDetails } from '../../models/phase-activity.model';

interface Props {
    details: IMeetingDetails;
    onChange: (details: IMeetingDetails) => void;
    disabled?: boolean;
}

export const MeetingDetailForm = ({ details, onChange, disabled }: Props) => {
    const meetingTypes = [
        { label: 'Coordination', value: 'COORDINATION' },
        { label: 'Consultation', value: 'CONSULTATION' },
        { label: 'Focus Group Discussion (FGD)', value: 'FGD' },
        { label: 'Other', value: 'OTHER' },
    ];

    return (
        <div className="grid">
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Meeting Type</label>
                <Dropdown
                    value={details.meetingType || ''}
                    options={meetingTypes}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => onChange({ ...details, meetingType: e.value })}
                    placeholder="Select Meeting Type"
                    disabled={disabled}
                    className="w-full"
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Venue</label>
                <InputText
                    value={details.venue || ''}
                    onChange={(e) => onChange({ ...details, venue: e.target.value })}
                    placeholder="e.g., Conference Room B"
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Target Participants</label>
                <InputNumber
                    value={details.participantsTarget ?? null}
                    onValueChange={(e) => onChange({ ...details, participantsTarget: e.value ?? undefined })}
                    min={0}
                    useGrouping={false}
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-6">
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