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

    const isRange = isRangeConstraint(
        constraint.constraint as ApplicantConstraintType
    );

    const isList = isListConstraint(
        constraint.constraint as ApplicantConstraintType);

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

    const emptyComposition: Composition = { constraint, max: 0, min: 0 };
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
        // Composition min/max (always shown)
        { field: "min", header: "Min Applicants", sortable: true },
        { field: "max", header: "Max Applicants", sortable: true },

        // Range constraint values (age, experience, etc.)
        isRange && {
            field: "range.min",
            header: `${constraint.constraint} From`,
            sortable: true,
        },

        isRange && {
            field: "range.max",
            header: `${constraint.constraint} To`,
            sortable: true,
        },

        // List constraint value
        isList && {
            field: "item",
            header: "Item",
            sortable: true,
        },
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
                onDelete={(row) => confirm.ask({ item: String(row.constraint), onConfirmAsync: () => deleteComposition(row) })}
            />

            {(selectedComposition && showSaveDialog) && (
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
