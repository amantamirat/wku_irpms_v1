'use client';
import { CrudManager } from '@/components/CrudManager';
import ErrorCard from '@/components/ErrorCard';
import ListSkeleton from '@/components/ListSkeleton';
import { useAuth } from '@/contexts/auth-context';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';
import { useCrudList } from '@/hooks/useCrudList';
import { ConstraintApi } from '../api/constraint.api';
import { ConstraintType, Constraint } from '../models/constraint.model';
import SaveDialog from './SaveDialog';
import CompositionManager from '../compositions/components/CompositionManager';
import { useState, useEffect } from 'react';
import { Grant } from '../../models/grant.model';
import { PERMISSIONS } from '@/types/permissions';

interface ConstraintManagerProps {
    type: ConstraintType;
    grant: Grant;
}

const ConstraintManager = ({ type, grant }: ConstraintManagerProps) => {
    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    // Permissions
    const canCreate = hasPermission([PERMISSIONS.CONSTRAINT.CREATE]);
    const canEdit = type === ConstraintType.PROJECT && hasPermission([PERMISSIONS.CONSTRAINT.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.CONSTRAINT.DELETE]);

    // CRUD State
    const {
        items: constraints,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError,
    } = useCrudList<Constraint>();

    const emptyConstraint: Constraint = { grant: grant, type };
    const [selectedConstraint, setSelectedConstraint] = useState<Constraint>(emptyConstraint);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[]>([]);

    // Fetch constraints
    useEffect(() => {
        const fetchConstraints = async () => {
            try {
                setLoading(true);
                const data = await ConstraintApi.getConstraints({ grant: grant, type });
                setAll(data);
            } catch (err: any) {
                setError(`Failed to fetch constraints. ${err.message ?? err}`);
            } finally {
                setLoading(false);
            }
        };
        fetchConstraints();
    }, [grant, type]);

    if (loading) return <ListSkeleton rows={10} />;
    if (error) return <ErrorCard errorMessage={error} />;

    // Save / update
    const onSaveComplete = (saved: Constraint) => {
        updateItem(saved);
        hideSaveDialog();
    };

    const deleteConstraint = async (row: Constraint) => {
        const deleted = await ConstraintApi.deleteConstraint(row);
        if (deleted) removeItem(row);
    };

    const hideSaveDialog = () => {
        setSelectedConstraint(emptyConstraint);
        setShowSaveDialog(false);
    };

    const columns = [
        { field: 'constraint', header: 'Constraint', sortable: true },
        type === ConstraintType.APPLICANT && { field: 'mode', header: 'Mode', sortable: true },
        type === ConstraintType.PROJECT && { field: 'min', header: 'Min', sortable: true },
        type === ConstraintType.PROJECT && { field: 'max', header: 'Max', sortable: true },
    ].filter(Boolean); // remove false values

    return (
        <>
            <CrudManager
                headerTitle={`${type} Constraints`}
                items={constraints}
                dataKey="_id"
                columns={columns as any}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => { setSelectedConstraint(emptyConstraint); setShowSaveDialog(true); }}
                onEdit={(row) => { setSelectedConstraint(row); setShowSaveDialog(true); }}
                onDelete={(row) => confirm.ask({ item: String(row.constraint), onConfirmAsync: () => deleteConstraint(row) })}
                expandedRows={type === ConstraintType.APPLICANT ? expandedRows : undefined}
                onRowToggle={type === ConstraintType.APPLICANT ? (e) => setExpandedRows(e.data) : undefined}
                rowExpansionTemplate={type === ConstraintType.APPLICANT ? (row) => <CompositionManager constraint={row} /> : undefined}
            />

            {selectedConstraint && (
                <SaveDialog
                    visible={showSaveDialog}
                    constraint={selectedConstraint}
                    onComplete={onSaveComplete}
                    onHide={hideSaveDialog}
                />
            )}
        </>
    );
};

export default ConstraintManager;
