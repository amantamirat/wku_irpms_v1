import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { IDataCollectionDetails } from '../../models/phase-activity.model';

interface Props {
    details: IDataCollectionDetails;
    onChange: (details: IDataCollectionDetails) => void;
    disabled?: boolean;
}

export const DataCollectionDetailForm = ({ details, onChange, disabled }: Props) => {
    const methods = [
        { label: 'Survey', value: 'SURVEY' },
        { label: 'Interview', value: 'INTERVIEW' },
        { label: 'Focus Group Discussion (FGD)', value: 'FGD' },
        { label: 'Observation', value: 'OBSERVATION' },
        { label: 'Measurement', value: 'MEASUREMENT' },
        { label: 'Secondary Data / Archival', value: 'SECONDARY_DATA' }
    ];

    return (
        <div className="grid">
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Method <span className="text-red-500">*</span></label>
                <Dropdown
                    value={details.method || ''}
                    options={methods}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => onChange({ ...details, method: e.value })}
                    placeholder="Select Method"
                    disabled={disabled}
                    className="w-full"
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Instrument / Tool</label>
                <InputText
                    value={details.instrument || ''}
                    onChange={(e) => onChange({ ...details, instrument: e.target.value })}
                    placeholder="e.g., Questionnaire v1, Checklist"
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Target Sample Size</label>
                <InputNumber
                    value={details.sampleSizeTarget ?? null}
                    onValueChange={(e) => onChange({ ...details, sampleSizeTarget: e.value ?? undefined })}
                    min={0}
                    useGrouping={false}
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Actual Sample Size</label>
                <InputNumber
                    value={details.sampleSizeActual ?? null}
                    onValueChange={(e) => onChange({ ...details, sampleSizeActual: e.value ?? undefined })}
                    min={0}
                    useGrouping={false}
                    disabled={disabled}
                />
            </div>
        </div>
    );
};