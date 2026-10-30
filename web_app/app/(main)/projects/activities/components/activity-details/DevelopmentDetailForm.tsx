import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { IDevelopmentDetails, DevelopmentCategory, ImplementationCategoryLabels } from '../../models/phase-activity.model';
import { PhaseActivityType } from '../../models/phase-activity.model';

interface Props {
    details: IDevelopmentDetails;
    onChange: (details: IDevelopmentDetails) => void;
    disabled?: boolean;
}

export const DevelopmentDetailForm = ({ details, onChange, disabled }: Props) => {
    const categoryOptions = Object.values(DevelopmentCategory).map((cat) => ({
        label: ImplementationCategoryLabels[cat].label,
        value: cat,
    }));

    return (
        <div className="grid">
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Development Category <span className="text-red-500">*</span></label>
                <Dropdown
                    value={details.category || ''}
                    options={categoryOptions}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => onChange({ ...details, kind: PhaseActivityType.DESIGN, category: e.value })}
                    placeholder="Select Category"
                    disabled={disabled}
                    className="w-full"
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Specification Description</label>
                <InputText
                    value={details.description || ''}
                    onChange={(e) => onChange({ ...details, kind: PhaseActivityType.DESIGN, description: e.target.value })}
                    placeholder="Brief description of deliverable"
                    disabled={disabled}
                />
            </div>
        </div>
    );
};