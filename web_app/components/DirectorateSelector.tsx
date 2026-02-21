'use client';
import { Dropdown } from 'primereact/dropdown';
import { useDirectorate } from '@/contexts/DirectorateContext';

export const DirectorateSelector = () => {
    const {
        directorates,
        directorate,
        setDirectorate
    } = useDirectorate();

    return (
        <div className="card p-fluid shadow-2">
            <div className="formgrid grid">
                <div className="field col-12 md:col-6 lg:col-4">
                    <label htmlFor="directorate">Directorate</label>
                    <Dropdown
                        id="directorate"
                        value={directorate}
                        options={directorates}
                        onChange={(e) => setDirectorate(e.value)}
                        optionLabel="name"
                        placeholder="Select Directorate"
                    />
                </div>
            </div>
        </div>
    );
};
