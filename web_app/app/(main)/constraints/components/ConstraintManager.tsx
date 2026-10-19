'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';
import { ItemManager, ItemManagerProps } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { IRange, formatRange } from '@/types/range';
import { etbCurrencyFormatter } from '@/utils/utils';
import { MENU_ICONS } from '@/utils/menu-icons';
import { Constraint } from '../models/constraint.model';
import { ConstraintApi } from '../api/constraint.api';
import ConstraintForm from './ConstraintForm';
import { ConstraintView } from './ConstraintView';

/* ---------- Formatters (stable references) ---------- */

const unit =
    (singular: string, plural = `${singular}s`) =>
    (val: number) =>
        `${val} ${val === 1 ? singular : plural}`;

const currencyFormat = (val: number) => etbCurrencyFormatter.format(val);
const daysFormat = unit('day');
const wordsFormat = unit('word');

/* ---------- Columns ---------- */

type RangeField = {
    [K in keyof Constraint]-?: NonNullable<Constraint[K]> extends IRange ? K : never;
}[keyof Constraint];

// Builds a column that renders a range field with the given formatter.
const rangeColumn = (
    header: string,
    field: RangeField,
    formatter?: (val: number) => string
): ColumnProps => ({
    header,
    field,
    body: (constraint: Constraint) =>
        formatRange(constraint[field] as IRange | undefined, formatter)
});

// Defined outside the component for a stable reference.
const columns: ColumnProps[] = [
    {
        header: 'Profile Name',
        field: 'name',
        sortable: true,
        body: (constraint: Constraint) => (
            <div>
                <div className="font-medium text-900">{constraint.name}</div>
                {constraint.description && (
                    <small className="text-500">{constraint.description}</small>
                )}
            </div>
        )
    },

    // Visible by default
    rangeColumn('Budget Range', 'budget', currencyFormat),
    rangeColumn('Duration', 'duration', daysFormat),
    rangeColumn('Participants', 'participants'),

    // Hidden by default
    rangeColumn('Phases', 'phases'),
    rangeColumn('Phase Budget', 'phaseBudget', currencyFormat),
    rangeColumn('Phase Duration', 'phaseDuration', daysFormat),
    rangeColumn('Activities', 'activities'),
    rangeColumn('Activity Duration', 'activityDuration', daysFormat),
    rangeColumn('Equipments', 'equipments'),
    rangeColumn('Equipment Cost', 'equipmentCost', currencyFormat),
    rangeColumn('Components', 'components'),
    rangeColumn('Title Words', 'titleWords', wordsFormat),
    rangeColumn('Summary Words', 'summaryWords', wordsFormat),
    rangeColumn('Specific Objectives', 'specificObjectives'),
    rangeColumn('Expected Outputs', 'expectedOutputs'),
    rangeColumn('Themes', 'themes'),
    rangeColumn('Sub-Themes', 'subThemes'),
    rangeColumn('Focus Areas', 'focusAreas'),
    rangeColumn('Indicators', 'indicators')
];

const defaultHiddenColumns: string[] = [
    'phases',
    'phaseBudget',
    'phaseDuration',
    'activities',
    'activityDuration',
    'equipments',
    'equipmentCost',
    'components',
    'titleWords',
    'summaryWords',
    'specificObjectives',
    'expectedOutputs',
    'themes',
    'subThemes',
    'focusAreas',
    'indicators'
];

export default function ConstraintManager() {
    const toast = useToast();

    // Memoize table configuration to maintain a stable reference.
    const tableProps: ItemManagerProps<
        Constraint,
        undefined
    >['tableProps'] = useMemo(
        () => ({
            expandable: {
                template: (constraint) => (
                    <ConstraintView constraint={constraint} />
                )
            }
        }),
        []
    );

    return (
        <ItemManager<Constraint, undefined>
            api={ConstraintApi}
            resource="constraint"
            itemName="Constraint Profile"
            headerTitle="Project Constraints"
            itemIcon={MENU_ICONS.constraints}
            columns={columns}
            enableColumnToggle
            defaultHiddenFields={defaultHiddenColumns}
            tableProps={tableProps}
            dialogWidth="min(960px, 95vw)"
            renderForm={(props) => <ConstraintForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Constraint profile created successfully'
                        : 'Constraint profile updated successfully'
                )
            }
        />
    );
}