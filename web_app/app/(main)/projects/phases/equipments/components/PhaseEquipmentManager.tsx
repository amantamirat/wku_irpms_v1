'use client';

import { useMemo } from 'react';
import { createEntityManager } from "@/components/data-table/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { Phase } from '../../models/phase.model';
import { PhaseEquipmentApi } from "../api/phase-equipment.api";
import { FilterPhaseEquipmentOptions, PhaseEquipment, PhaseEquipmentStatus, EquipmentUnit } from "../models/phase-equipment.model";
import SaveEquipment from './SaveEquipment';
import { etbCurrencyFormatter } from '@/utils/utils';
import { PHASE_EQUIPMENT_TRANSITIONS } from '../models/phase-equipment.state-machine';

interface PhaseEquipmentManagerProps {
    phase: Phase;
}

const PhaseEquipmentManager = ({ phase }: PhaseEquipmentManagerProps) => {

    // useMemo ensures that createEntityManager is only instantiated once 
    // per phase reference, keeping the hook counts stable across re-renders.
    const Manager = useMemo(() => {
        return createEntityManager<
            PhaseEquipment,
            FilterPhaseEquipmentOptions
        >({
            title: `Equipment for ${phase.title}`,
            itemName: "Equipment",

            api: PhaseEquipmentApi,

            columns: [
                {
                    header: "Item Name",
                    field: "itemName",
                    sortable: true,
                    body: (row: PhaseEquipment) => (
                        <span className="font-semibold text-gray-900">
                            {row.itemName}
                        </span>
                    )
                },
                {
                    header: "Description",
                    field: "description",
                    sortable: true
                },
                {
                    header: "Unit",
                    field: "unit",
                    sortable: true,
                    body: (row: PhaseEquipment) => (
                        <span className="capitalize text-gray-700">
                            {row.unit}
                        </span>
                    )
                },
                {
                    header: "Quantity",
                    field: "quantity",
                    sortable: true
                },
                {
                    header: "Unit Price",
                    field: "unitPrice",
                    sortable: true,
                    body: (row: PhaseEquipment) => (
                        <span className="font-mono text-green-700 font-medium">
                            {row.unitPrice !== undefined ? etbCurrencyFormatter.format(row.unitPrice) : '-'}
                        </span>
                    )
                },
                {
                    header: "Total Cost",
                    field: "totalCost", // Unique field identifier for cost calculation
                    body: (row: PhaseEquipment) => {
                        const total = (row.unitPrice || 0) * row.quantity;
                        return (
                            <span className="font-mono font-semibold text-gray-900">
                                {etbCurrencyFormatter.format(total)}
                            </span>
                        );
                    }
                },
                {
                    header: "Status",
                    field: "status",
                    body: (row: PhaseEquipment) => (
                        <MyBadge
                            type="status"
                            value={row.status ?? PhaseEquipmentStatus.planned}
                        />
                    )
                }
            ],

            workflow: {
                statusField: "status",
                transitions: PHASE_EQUIPMENT_TRANSITIONS
            },

            createNew: () => ({
                phase,
                itemName: "",
                description: "",
                unit: EquipmentUnit.number,
                quantity: 1,
                unitPrice: 0,
                status: PhaseEquipmentStatus.planned
            }),

            SaveDialog: SaveEquipment,

            permissionPrefix: "phaseEquipment",

            query: () => ({
                phase: phase._id
            }),
        });
    }, [phase]);

    return (
        <div className="space-y-4">
            <Manager key={phase._id} />
        </div>
    );
};

export default PhaseEquipmentManager;