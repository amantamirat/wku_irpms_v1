'use client';
import { CrudManager } from '@/components/CrudManager';
import ErrorCard from '@/components/ErrorCard';
import ListSkeleton from '@/components/ListSkeleton';
import { useAuth } from '@/contexts/auth-context';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';
import { useCrudList } from '@/hooks/useCrudList';
import { PERMISSIONS } from '@/types/permissions';
import { useEffect, useState } from 'react';
import { Grant } from '../../models/grant.model';
import { ConstraintApi } from '../api/constraint.api';
import { Constraint } from '../models/constraint.model';
import SaveDialog from './SaveDialog';

interface ConstraintManagerProps {
    grant: Grant;
}

const ConstraintManager = ({ grant }: ConstraintManagerProps) => {
    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    // Permissions
    const canCreate = hasPermission([PERMISSIONS.CONSTRAINT.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.CONSTRAINT.UPDATE]);
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

    const emptyConstraint: Constraint = { grant: grant };
    const [selectedConstraint, setSelectedConstraint] = useState<Constraint>(emptyConstraint);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[]>([]);

    // Fetch constraints
    useEffect(() => {
        const fetchConstraints = async () => {
            try {
                setLoading(true);
                const data = await ConstraintApi.getConstraints({ grant: grant });
                setAll(data);
            } catch (err: any) {
                setError(`Failed to fetch constraints. ${err.message ?? err}`);
            } finally {
                setLoading(false);
            }
        };
        fetchConstraints();
    }, [grant]);

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
        { field: 'min', header: 'Min', sortable: true },
        { field: 'max', header: 'Max', sortable: true },
    ].filter(Boolean);

    return (
        <>
            <CrudManager
                headerTitle={`Constraints`}
                items={constraints}
                dataKey="_id"
                columns={columns as any}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => { setSelectedConstraint(emptyConstraint); setShowSaveDialog(true); }}
                onEdit={(row) => { setSelectedConstraint(row); setShowSaveDialog(true); }}
                onDelete={(row) => confirm.ask({ item: String(row.constraint), onConfirmAsync: () => deleteConstraint(row) })}
            />

            {(selectedConstraint && showSaveDialog) && (
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
