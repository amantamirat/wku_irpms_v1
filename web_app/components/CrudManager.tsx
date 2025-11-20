import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable, DataTableExpandedRows } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";

interface CrudManagerProps<T> {
    title?: string;
    items: T[];
    dataKey: string;
    columns: any[];
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    onCreate?: () => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    expandedRows?: any[] | DataTableExpandedRows;
    onRowToggle?: (exp: any) => void;
    rowExpansionTemplate?: (row: T) => React.ReactNode;
}

export function CrudManager<T extends { _id?: string }>({
    title,
    items,
    dataKey,
    columns,
    canCreate,
    canEdit,
    canDelete,
    onCreate,
    onEdit,
    onDelete,
    expandedRows,
    onRowToggle,
    rowExpansionTemplate
}: CrudManagerProps<T>) {

    const renderToolbar = () => {
        if (!canCreate || !onCreate) return null;
        return (
            <Toolbar
                className="mb-3"
                start={
                    <Button
                        label={`New ${title}`}
                        icon="pi pi-plus"
                        severity="success"
                        onClick={onCreate}
                    />
                }
            />
        );
    };

    const actionBody = (row: T) => (
        <div className="flex gap-2">
            {canEdit && (
                <Button
                    icon="pi pi-pencil"
                    rounded
                    severity="success"
                    className="p-button-text"
                    onClick={() => onEdit?.(row)}
                />
            )}
            {canDelete && (
                <Button
                    icon="pi pi-trash"
                    rounded
                    severity="danger"
                    className="p-button-text"
                    onClick={() => onDelete?.(row)}
                />
            )}
        </div>
    );

    return (
        <div className="card">
            {renderToolbar()}
            <DataTable
                value={items}
                dataKey={dataKey}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                scrollable
                emptyMessage="No data found."
                expandedRows={expandedRows}
                onRowToggle={onRowToggle}
                rowExpansionTemplate={rowExpansionTemplate}
            >
                {rowExpansionTemplate && <Column expander style={{ width: "3rem" }} />}

                <Column
                    header="#"
                    body={(row, options) => options.rowIndex + 1}
                    style={{ width: "4rem" }}
                />

                {columns.map((col, idx) => (
                    <Column key={idx} {...col} />
                ))}

                {(canEdit || canDelete) && <Column body={actionBody} header="Actions" />}
            </DataTable>
        </div>
    );
}
