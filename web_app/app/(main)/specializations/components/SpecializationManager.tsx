'use client';

import { ColumnProps } from "primereact/column";
import { ItemManager, ItemManagerProps } from "@/components/ItemManager";
import { useToast } from "@/contexts/ToastContext";
import { SpecializationApi } from "../api/specialization.api";
import { Specialization } from "../models/specialization.model";
import SpecializationForm from "./SpecializationForm";
import { MENU_ICONS } from "@/utils/menu-icons";

// Defined outside the component so the references stay stable between renders
const columns: ColumnProps[] = [
    { header: "Name", field: "name", sortable: true },
    { header: "Academic Level", field: "academicLevel", sortable: true },
];

// Optional: Add table props if you need expandable rows or custom behavior
const tableProps: ItemManagerProps<Specialization>["tableProps"] = {};

export default function SpecializationManager() {
    const toast = useToast();

    return (
        <ItemManager<Specialization>
            api={SpecializationApi}
            resource="specialization"
            itemName="Specialization"
            headerTitle="Manage Specializations"
            itemIcon={MENU_ICONS.specializations} // Make sure you have this icon registered, or change it as needed
            columns={columns}
            tableProps={tableProps}
            dialogWidth="40rem"
            renderForm={(props) => <SpecializationForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(operation === "create" ? "Specialization created" : "Specialization updated")
            }
        />
    );
}