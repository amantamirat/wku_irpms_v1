'use client';
import { CrudManager } from '@/components/CrudManager';
import ErrorCard from '@/components/ErrorCard';
import ListSkeleton from '@/components/ListSkeleton';
import { useCrudList } from '@/hooks/useCrudList';
import { useAuth } from '@/contexts/auth-context';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';
import { CompositionApi } from '../api/composition.api';
import { Composition } from '../models/composition.model';
import SaveDialog from './SaveDialog';
import { Constraint } from '../../models/constraint.model';
import { ApplicantConstraintType, isRangeConstraint, isListConstraint } from '../../models/applicant-constaint-type';
import { useEffect, useState } from 'react';
import { PERMISSIONS } from '@/types/permissions';

interface CompositionManagerProps {
    constraint: Constraint;
}

const CompositionManager = ({ constraint }: CompositionManagerProps) => {
    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.CONSTRAINT.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.CONSTRAINT.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.CONSTRAINT.DELETE]);

    // CRUD Hook
    const {
        items: compositions,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Composition>();

    const emptyComposition: Composition = { constraint, value: 0 };
    const [selectedComposition, setSelectedComposition] = useState<Composition>(emptyComposition);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    // Fetch compositions
    useEffect(() => {
        const fetchCompositions = async () => {
            try {
                setLoading(true);
                const data = await CompositionApi.getCompositions({ constraint: constraint._id });
                setAll(data);
            } catch (err: any) {
                setError(`Failed to fetch compositions. ${err.message ?? err}`);
            } finally {
                setLoading(false);
            }
        };
        fetchCompositions();
    }, [constraint]);

    if (loading) return <ListSkeleton rows={10} />;
    if (error) return <ErrorCard errorMessage={error} />;

    const onSaveComplete = (saved: Composition) => {
        updateItem(saved);
        hideSaveDialog();
    };

    const deleteComposition = async (row: Composition) => {
        const deleted = await CompositionApi.deleteComposition(row);
        if (deleted) removeItem(row);
    };

    const hideSaveDialog = () => {
        setSelectedComposition(emptyComposition);
        setShowSaveDialog(false);

    };

    const columns = [
        isRangeConstraint(constraint.constraint as ApplicantConstraintType) && { field: 'min', header: 'Min', sortable: true },
        isRangeConstraint(constraint.constraint as ApplicantConstraintType) && { field: 'max', header: 'Max', sortable: true },
        isListConstraint(constraint.constraint as ApplicantConstraintType) && { field: 'item', header: 'Item', sortable: true },
        { field: 'value', header: 'Value', sortable: true }
    ].filter(Boolean);

    return (
        <>
            <CrudManager
                headerTitle={`Compositions for ${constraint.constraint}`}
                items={compositions}
                dataKey="_id"
                columns={columns as any}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => { setSelectedComposition(emptyComposition); setShowSaveDialog(true); }}
                onEdit={(row) => { setSelectedComposition(row); setShowSaveDialog(true); }}
                onDelete={(row) => confirm.ask({ item: String(row.value), onConfirmAsync: () => deleteComposition(row) })}
            />

            {selectedComposition && (
                <SaveDialog
                    visible={showSaveDialog}
                    composition={selectedComposition}
                    parent={constraint}
                    onComplete={onSaveComplete}
                    onHide={hideSaveDialog}
                />
            )}
        </>
    );
};

export default CompositionManager;
