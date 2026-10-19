'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Evaluation } from '../../evaluations/models/evaluation.model';
import { CriterionApi } from '../api/criterion.api';
import { Criterion, FormType, FilterCriteriaOptions } from '../models/criterion.model';
import CriterionForm from './CriterionForm';
import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';

interface CriterionManagerProps {
    evaluation: Evaluation;
}

const getCriterionColumns = (): ColumnProps[] => [
    {
        header: "Title",
        field: "title",
        sortable: true
    },
    {
        header: "Weight",
        field: "weight",
        sortable: true,
        body: (rowData: Criterion) => (
            <span className="font-bold text-primary">{rowData.weight}%</span>
        )
    },
    {
        header: "Type",
        field: "formType",
        body: (rowData: Criterion) => {
            const severity = rowData.formType === FormType.OPEN ? 'info' : 'success';
            return <Tag value={rowData.formType} severity={severity} />;
        }
    },
    {
        header: "Options",
        body: (rowData: Criterion) => {
            const count = rowData.options?.length || 0;
            return count > 0 ? (
                <Tag value={`${count} Options`} icon="pi pi-list" severity="warning" />
            ) : (
                <span className="text-400 italic text-sm">N/A</span>
            );
        }
    }
];

export default function CriterionManager({ evaluation }: CriterionManagerProps) {
    const toast = useToast();

    const columns = useMemo(() => getCriterionColumns(), []);
    const filter = useMemo<FilterCriteriaOptions>(() => ({
        evaluation: evaluation._id,
        populate: false
    }), [evaluation]);

    return (
        <ItemManager<Criterion, FilterCriteriaOptions>
            key={evaluation._id}
            api={CriterionApi}
            resource='criterion'
            itemName="Criterion"
            headerTitle={`${evaluation.title}-Criteria`}
            itemIcon={MENU_ICONS.criteria}
            columns={columns}
            filter={filter}
            dialogWidth="700px"
            renderForm={(props) => <CriterionForm {...props} evaluation={evaluation} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === "create"
                        ? "Criterion created successfully"
                        : "Criterion updated successfully"
                )
            }
        />
    );
}