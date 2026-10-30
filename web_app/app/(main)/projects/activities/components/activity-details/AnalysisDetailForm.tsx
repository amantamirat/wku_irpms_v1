import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { IAnalysisDetails } from '../../models/phase-activity.model';

interface Props {
    details: IAnalysisDetails;
    onChange: (details: IAnalysisDetails) => void;
    disabled?: boolean;
}

export const AnalysisDetailForm = ({ details, onChange, disabled }: Props) => {
    const analysisTypes = [
        { label: 'Statistical', value: 'STATISTICAL' },
        { label: 'Qualitative', value: 'QUALITATIVE' },
        { label: 'Financial', value: 'FINANCIAL' },
        { label: 'Experimentation', value: 'EXPERIMENTATION' },
        { label: 'Other', value: 'OTHER' },
    ];

    return (
        <div className="grid">
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Analysis Type</label>
                <Dropdown
                    value={details.analysisType || ''}
                    options={analysisTypes}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => onChange({ ...details, analysisType: e.value })}
                    placeholder="Select Analysis Type"
                    disabled={disabled}
                    className="w-full"
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Dataset Reference</label>
                <InputText
                    value={details.datasetReference || ''}
                    onChange={(e) => onChange({ ...details, datasetReference: e.target.value })}
                    placeholder="e.g., Survey_Results_2026.csv"
                    disabled={disabled}
                />
            </div>
            <div className="field col-12">
                <label className="font-bold text-sm block mb-2">Methodology</label>
                <InputText
                    value={details.methodology || ''}
                    onChange={(e) => onChange({ ...details, methodology: e.target.value })}
                    placeholder="e.g., Descriptive statistics & regression models"
                    disabled={disabled}
                />
            </div>
        </div>
    );
};