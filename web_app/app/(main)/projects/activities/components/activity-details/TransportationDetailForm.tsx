import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { ITransportationDetails } from '../../models/phase-activity.model';

interface Props {
    details: ITransportationDetails;
    onChange: (details: ITransportationDetails) => void;
    disabled?: boolean;
}

export const TransportationDetailForm = ({ details, onChange, disabled }: Props) => {
    const transportModes = [
        { label: 'Vehicle Hire', value: 'VEHICLE_HIRE' },
        { label: 'Project Vehicle', value: 'PROJECT_VEHICLE' },
        { label: 'Public Transport', value: 'PUBLIC_TRANSPORT' },
        { label: 'Freight', value: 'FREIGHT' },
        { label: 'Other', value: 'OTHER' },
    ];

    return (
        <div className="grid">
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Transport Mode</label>
                <Dropdown
                    value={details.transportMode || ''}
                    options={transportModes}
                    optionLabel="label"
                    optionValue="value"
                    onChange={(e) => onChange({ ...details, transportMode: e.value })}
                    placeholder="Select Transport Mode"
                    disabled={disabled}
                    className="w-full"
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Origin Location Name</label>
                <InputText
                    value={details.origin?.name || ''}
                    onChange={(e) => onChange({ ...details, origin: { ...details.origin, name: e.target.value } })}
                    placeholder="e.g., Wolkite Campus"
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-6">
                <label className="font-bold text-sm block mb-2">Destination Location Name</label>
                <InputText
                    value={details.destination?.name || ''}
                    onChange={(e) => onChange({ ...details, destination: { ...details.destination, name: e.target.value } })}
                    placeholder="e.g., Field Site 1"
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-3">
                <label className="font-bold text-sm block mb-2">Trip Count</label>
                <InputNumber
                    value={details.tripCount ?? null}
                    onValueChange={(e) => onChange({ ...details, tripCount: e.value ?? undefined })}
                    min={0}
                    useGrouping={false}
                    disabled={disabled}
                />
            </div>
            <div className="field col-12 md:col-3">
                <label className="font-bold text-sm block mb-2">Distance (Km)</label>
                <InputNumber
                    value={details.distanceKm ?? null}
                    onValueChange={(e) => onChange({ ...details, distanceKm: e.value ?? undefined })}
                    min={0}
                    useGrouping={false}
                    disabled={disabled}
                />
            </div>
        </div>
    );
};