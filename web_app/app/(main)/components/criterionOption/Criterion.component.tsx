'use client';

import DeleteDialog from '@/components/DeleteDialog';
import { CriterionOption } from '@/models/evaluation/criterionOption';
import { Weight } from '@/models/evaluation/weight';
import { CriterionOptionService } from '@/services/evaluation/CriterionOptionService';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import SaveDialog from './dialog/SaveDialog';

interface CriterionOptionCompProps {
    weight: Weight;
    criterionOptions: CriterionOption[];
    setCriterionOptions: (options: CriterionOption[]) => void;
}

const CriterionOptionComp = (props: CriterionOptionCompProps) => {

    const { weight } = props;

    const emptyCriterionOption: CriterionOption = {
        weight: weight,
        label: '',
        value: 0
    };

    const { criterionOptions, setCriterionOptions } = props;
    const dt = useRef<DataTable<any>>(null);
    const [selectedCriterionOption, setSelectedCriterionOption] = useState<CriterionOption>(emptyCriterionOption);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);


    const saveCriterionOption = async () => {
        try {
            let _criterionOptions = [...criterionOptions];
            const index = _criterionOptions.findIndex((c) => c._id === selectedCriterionOption._id);
            if (index === -1) {
                //const created = await CriterionOptionService.createCriterionOption(selectedCriterionOption);
                //_criterionOptions.push(created);
                _criterionOptions.push({ ...selectedCriterionOption, _id: uuidv4() });
            }
            else {
                //const updated = await CriterionOptionService.updateCriterionOption(selectedCriterionOption);
                //const index = _criterionOptions.findIndex((c) => c._id === selectedCriterionOption._id);
                _criterionOptions[index] = selectedCriterionOption;
            }
            setCriterionOptions(_criterionOptions);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `CriterionOption ${index !== -1 ? 'edited' : 'added'}`,
                life: 1000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save criterionOption',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedCriterionOption(emptyCriterionOption);
        }
    };

    const deleteCriterionOption = async () => {
        try {
            const deleted = await CriterionOptionService.deleteCriterionOption(selectedCriterionOption);
            if (deleted) {
                setCriterionOptions(criterionOptions.filter((c) => c._id !== selectedCriterionOption._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'CriterionOption deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete criterionOption',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedCriterionOption(emptyCriterionOption);
        }
    };


    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <div className="my-2">
                <Button icon="pi pi-plus" severity="secondary" className="mr-0"
                    onClick={() => {
                        setSelectedCriterionOption(emptyCriterionOption);
                        setShowSaveDialog(true);
                    }}
                />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData: CriterionOption) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedCriterionOption(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedCriterionOption(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );



    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <DataTable
                        ref={dt}
                        value={criterionOptions}
                        selection={selectedCriterionOption}
                        onSelectionChange={(e) => setSelectedCriterionOption(e.value as CriterionOption)}
                        dataKey="_id"
                        className="datatable-responsive"
                        emptyMessage={'No criterion Options data found.'}
                        header={header}
                        scrollable
                        rows={3}
                        rowsPerPageOptions={[3, 5, 8]}
                        paginator
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    >
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="label" header="Label" sortable />
                        <Column field="value" header="Value" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                    </DataTable>

                    {selectedCriterionOption && (
                        <SaveDialog
                            visible={showSaveDialog}
                            criterionOption={selectedCriterionOption}
                            onChange={setSelectedCriterionOption}
                            onSave={saveCriterionOption}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedCriterionOption && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedCriterionOption.label)}
                            onDelete={deleteCriterionOption}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CriterionOptionComp;
