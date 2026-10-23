'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';

import { ReviewerApi } from '../api/reviewer.api';
import { Reviewer, FilterReviewersDTO, ReviewerTargetType } from '../models/reviewer.model';
import ReviewerForm from './ReviewerForm';
import { Application } from '../../applications/models/application.model';
import { Verification } from '../../verifications/models/verification.model';

interface ReviewerManagerProps {
    targetType: ReviewerTargetType,
    application?: Application;
    verification?: Verification;
    updateApplication?: (application: Application) => void;
}

const DEFAULT_HIDDEN = [
    "createdBy.name"
];

const getReviewerColumns = (): ColumnProps[] => [
    {
        header: "Reviewer",
        field: "reviewer",
        sortable: true,
        body: (rowData: Reviewer) =>
            typeof rowData.reviewer === 'object' && rowData.reviewer !== null
                ? (rowData.reviewer as any).name
                : rowData.reviewer ?? '-',
    },
    {
        header: "Weight Assignment",
        field: "weight",
        sortable: true,
        style: { width: '12rem' },
        body: (rowData: Reviewer) => (
            <span className="font-bold text-primary">{rowData.weight ?? 1}</span>
        ),
    },
    {
        header: "Assigned By",
        field: "createdBy.name",
        sortable: true,
        body: (rowData: Reviewer) =>
            typeof rowData.createdBy === 'object' && rowData.createdBy !== null
                ? (rowData.createdBy as any).name || (rowData.createdBy as any).email
                : rowData.createdBy ?? '-',
    },
];

const mapSaved = (saved: Reviewer, submitted: Partial<Reviewer>): Reviewer => ({
    ...saved,
    reviewer: submitted.reviewer,
});

export default function ReviewerManager({ targetType, application, verification }: ReviewerManagerProps) {
    const toast = useToast();

    const columns = useMemo(() => getReviewerColumns(), []);

    const filter = useMemo<FilterReviewersDTO | undefined>(() => {
        const filters: FilterReviewersDTO = {
            targetType
        };
        if (application) filters.application = application;
        if (verification) filters.verification = verification;
        return Object.keys(filters).length > 0 ? filters : undefined;
    }, [targetType, application, verification]);

    return (
        <ItemManager<Reviewer, FilterReviewersDTO>
            api={ReviewerApi}
            resource="reviewer"
            itemName="Reviewer"
            headerTitle="Manage Reviewers"
            itemIcon={MENU_ICONS.reviewers}
            mapSaved={mapSaved}
            columns={columns}
            enableColumnToggle
            defaultHiddenFields={DEFAULT_HIDDEN}
            filter={filter}
            dialogWidth="500px"
            renderForm={(props) => (
                <ReviewerForm
                    {...props}
                    targetType={targetType}
                    targetId={
                        targetType === ReviewerTargetType.APPLICATION
                            ? application?._id
                            : verification?._id
                    }
                />
            )}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === "create"
                        ? "Reviewer added successfully"
                        : "Reviewer updated successfully"
                )
            }
        />
    );
}