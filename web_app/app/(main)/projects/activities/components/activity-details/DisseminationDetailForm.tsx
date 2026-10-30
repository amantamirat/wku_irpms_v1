import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { IDisseminationDetails } from '../../models/phase-activity.model';

interface Props {
    details: IDisseminationDetails;
    onChange: (details: IDisseminationDetails) => void;
    disabled?: boolean;
}

export const DisseminationDetailForm = ({ details, onChange, disabled }: Props) => {
    const disseminationTypes = [
        { label: 'Publication', value: 'PUBLICATION' },
        { label: 'Presentation', value: 'PRESENTATION' },
        { label: 'Conference', value: 'CONFERENCE' },
        { label: 'Public Event', value: 'PUBLIC_EVENT' },
        { label: 'Other', value: 'OTHER' },
    ];

    return (
        <div className="grid">
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Dissemination Type</label>
                <Dropdown
                    value={details.disseminationType || ''}
                    options={disseminationTypes}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => onChange({ ...details, disseminationType: e.value })}
                    placeholder="Select Type"
                    disabled={disabled}
                    className="w-full"
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Venue / Journal</label>
                <InputText
                    value={details.venue || ''}
                    onChange={(e) => onChange({ ...details, venue: e.target.value })}
                    placeholder="e.g., Annual Research Symposium"
                    disabled={disabled}
                />
            </div>
            <div className="field col-12">
                <label className="font-bold text-sm block mb-2">Target Audience</label>
                <InputText
                    value={details.targetAudience || ''}
                    onChange={(e) => onChange({ ...details, targetAudience: e.target.value })}
                    placeholder="e.g., Academic peers and stakeholders"
                    disabled={disabled}
                />
            </div>
        </div>
    );
};