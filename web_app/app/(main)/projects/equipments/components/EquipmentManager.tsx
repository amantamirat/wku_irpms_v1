'use client';

import { ColumnProps } from 'primereact/column';
import { useMemo } from 'react';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';

import {
    PhaseEquipment,
    FilterPhaseEquipmentOptions
} from '../models/phase-equipment.model';
import { PhaseEquipmentApi } from '../api/phase-equipment.api';
import EquipmentForm from './EquipmentForm';

import { Project } from '@/app/(main)/projects/models/project.model';
import { etbCurrencyFormatter } from '@/utils/utils';
import MyBadge from '@/templates/MyBadge';
import { PHASE_EQUIPMENT_TRANSITIONS } from '../models/phase-equipment.state-machine';
import { Phase } from '../../phases/models/phase.model';

// Defined outside the component for a stable reference.
const columns: ColumnProps[] = [
    {
        header: 'Equipment',
        field: 'itemName',
        sortable: true,
        body: (row: PhaseEquipment) => (
            <span className="font-medium">
                {row.itemName}
            </span>
        )
    },
    {
        header: 'Description',
        field: 'description',
        sortable: true,
        body: (row: PhaseEquipment) => (
            <span className="text-600 text-sm">
                {row.description
                    ? row.description.length > 50
                        ? `${row.description.substring(0, 50)}...`
                        : row.description
                    : '—'}
            </span>
        )
    },
    {
        header: 'Unit',
        field: 'unit',
        sortable: true,
        body: (row: PhaseEquipment) => (
            <span className="text-sm">
                {row.unit || '—'}
            </span>
        )
    },
    {
        header: 'Pack Size',
        field: 'packSize',
        sortable: true,
        body: (row: PhaseEquipment) => (
            <span className="font-mono">
                {row.unit === 'number'
                    ? '1'
                    : row.packSize ?? '—'}
            </span>
        )
    },
    {
        header: 'Quantity',
        field: 'quantity',
        sortable: true,
        body: (row: PhaseEquipment) => (
            <span className="font-mono">
                {row.quantity ?? 0}
            </span>
        )
    },
    {
        header: 'Unit Price',
        field: 'unitPrice',
        sortable: true,
        body: (row: PhaseEquipment) => (
            <span className="font-mono">
                {etbCurrencyFormatter.format(row.unitPrice ?? 0)}
            </span>
        )
    },
    {
        header: 'Total Cost',
        field: 'totalCost',
        sortable: false,
        body: (row: PhaseEquipment) => {
            const total =
                (row.unitPrice ?? 0) * (row.quantity ?? 0);

            return (
                <span className="font-mono font-semibold text-gray-900">
                    {etbCurrencyFormatter.format(total)}
                </span>
            );
        }
    },
    {
        header: 'Status',
        field: 'status',
        sortable: true,
        body: (row: PhaseEquipment) => (
            <MyBadge
                type="status"
                value={row.status ?? 'Unknown'}
            />
        )
    }
];

const defaultHiddenFields = [
    'description',
    'unit',
    'packSize',
    'unitPrice'
];

interface EquipmentManagerProps {
    project?: Project;
    phase?: Phase;
    useLookup?: boolean;
    disableCrud?: boolean;
}

const EquipmentManager = ({
    project,
    phase,
    useLookup = false,
    disableCrud = false
}: EquipmentManagerProps) => {
    const toast = useToast();

    const filter = useMemo<FilterPhaseEquipmentOptions>(
        () => ({
            project: project,
            phase: phase
        }),
        [project, phase]
    );

    return (
        <ItemManager<PhaseEquipment, FilterPhaseEquipmentOptions>
            api={PhaseEquipmentApi}
            useLookup={useLookup}
            resource="phaseEquipment"
            itemName="Equipment"
            itemIcon={MENU_ICONS.equipments}
            headerTitle="Manage Equipments"
            columns={columns}
            filter={filter}
            dialogWidth="720px"
            enableColumnToggle
            defaultHiddenFields={defaultHiddenFields}
            statusField="status"
            hideCreateAction={disableCrud}
            hideEditAction={disableCrud}
            hideDeleteAction={disableCrud}
            transitions={
                PHASE_EQUIPMENT_TRANSITIONS
            }
            renderForm={
                disableCrud
                    ? undefined
                    : (props) => (
                          <EquipmentForm
                              {...props}
                              project={project}
                              phase={phase}
                          />
                      )
            }
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Equipment created successfully'
                        : 'Equipment updated successfully'
                )
            }
        />
    );
};

export default EquipmentManager;