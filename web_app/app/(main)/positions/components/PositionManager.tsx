'use client';

import { ColumnProps } from "primereact/column";
import { ItemManager, ItemManagerProps } from "@/components/ItemManager";
import { useToast } from "@/contexts/ToastContext";
import { PositionApi } from "../api/position.api";
import { Position } from "../models/position.model";
import PositionForm from "./PositionForm";
import { MENU_ICONS } from "@/utils/menu-icons";

// Defined outside the component so references stay stable between renders
const columns: ColumnProps[] = [
    { header: "Name", field: "name", sortable: true },
];

const tableProps: ItemManagerProps<Position>["tableProps"] = {};

export default function PositionManager() {
    const toast = useToast();

    return (
        <ItemManager<Position>
            api={PositionApi}
            resource="position"
            itemName="Position"
            headerTitle="Manage Positions"
            itemIcon={MENU_ICONS.positions} // Make sure you have this icon registered, or change as needed
            columns={columns}
            tableProps={tableProps}
            dialogWidth="40rem"
            renderForm={(props) => <PositionForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(operation === "create" ? "Position created" : "Position updated")
            }
        />
    );
}