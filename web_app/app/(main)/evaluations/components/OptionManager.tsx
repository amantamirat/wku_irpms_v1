'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { Option } from "../models/option.model";
import { Criterion } from "../models/criterion.model";
import { OptionApi } from "../api/option.api";
import SaveOption from "./SaveOption";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";

interface OptionManagerProps {
    criterion: Criterion;
}

const OptionManager = ({ criterion }: OptionManagerProps) => {

    const emptyOption: Option = {
        title: "",
        score: 0,
        criterion: criterion,
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = true//hasPermission([PERMISSIONS.OPTION.CREATE]);
    const canEdit = true//hasPermission([PERMISSIONS.OPTION.UPDATE]);
    const canDelete = true//hasPermission([PERMISSIONS.OPTION.DELETE]);

    /** CRUD Hook */
    const {
        items: options,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError,
    } = useCrudList<Option>();

    const [option, setOption] = useState<Option>(emptyOption);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch options for this criterion */
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setLoading(true);
                const data = await OptionApi.getOptions({ criterion});
                setAll(data);
            } catch (err: any) {
                setError("Failed to load options. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [criterion]);

    /** Save callback */
    const onSaveComplete = (saved: Option) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete */
    const deleteOption = async (row: Option) => {
        const ok = await OptionApi.deleteOption(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        setShowSaveDialog(false);
    };

    /** CRUD table columns */
    const columns = [
        { header: "Title", field: "title" },
        { header: "Score", field: "score" },
    ];

    return (
        <>
            <CrudManager
                headerTitle={`Manage Options for "${criterion.title}"`}
                itemName="Option"
                items={options}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}

                enableSearch
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}

                onCreate={() => {
                    setOption({ ...emptyOption });
                    setShowSaveDialog(true);
                }}

                onEdit={(row) => {
                    setOption({ ...row });
                    setShowSaveDialog(true);
                }}

                onDelete={(row) =>
                    confirm.ask({
                        item: row.title,
                        onConfirmAsync: () => deleteOption(row),
                    })
                }
            />

            {/* Save Dialog */}
            {option && (
                <SaveOption
                    visible={showSaveDialog}
                    option={option}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default OptionManager;
