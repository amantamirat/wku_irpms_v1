'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';
import { ItemManager, ItemManagerProps } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { formatRange } from '@/types/range';
import { etbCurrencyFormatter } from '@/utils/utils';
import { MENU_ICONS } from '@/utils/menu-icons';
import { Constraint } from '../models/constraint.model';
import { ConstraintApi } from '../api/constraint.api';
import ConstraintForm, { GroupKey, getRange } from './ConstraintForm';
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

interface RangeColumnSpec {
    header: string;
    group: GroupKey;
    key: string;
    formatter?: (val: number) => string;
    hidden?: boolean;
}

// Column field uses the nested path (e.g. "phaseConstraints.budget"),
// which is also the id used by the column toggle.
const fieldOf = (s: RangeColumnSpec) => `${s.group}.${s.key}`;

const rangeColumn = (spec: RangeColumnSpec): ColumnProps => ({
    header: spec.header,
    field: fieldOf(spec),
    body: (constraint: Constraint) =>
        formatRange(getRange(constraint, spec.group, spec.key), spec.formatter)
});

const rangeSpecs: RangeColumnSpec[] = [
    // Visible by default
    { header: 'Budget Range', group: 'projectConstraints', key: 'budget', formatter: currencyFormat },
    { header: 'Duration', group: 'projectConstraints', key: 'duration', formatter: daysFormat },
    { header: 'Members', group: 'collaboratorConstraints', key: 'members' },

    // Hidden by default
    { header: 'Phases', group: 'phaseConstraints', key: 'phases', hidden: true },
    { header: 'Phase Budget', group: 'phaseConstraints', key: 'budget', formatter: currencyFormat, hidden: true },
    { header: 'Phase Duration', group: 'phaseConstraints', key: 'duration', formatter: daysFormat, hidden: true },
    { header: 'Activities', group: 'activityConstraints', key: 'activities', hidden: true },
    { header: 'Activity Cost', group: 'activityConstraints', key: 'cost', formatter: currencyFormat, hidden: true },
    { header: 'Activity Duration', group: 'activityConstraints', key: 'duration', formatter: daysFormat, hidden: true },
    { header: 'Equipments', group: 'equipmentConstraints', key: 'equipments', hidden: true },
    { header: 'Equipment Cost', group: 'equipmentConstraints', key: 'cost', formatter: currencyFormat, hidden: true },
    { header: 'Components', group: 'componentConstraints', key: 'components', hidden: true },
    { header: 'Component Collaborators', group: 'componentConstraints', key: 'collaborators', hidden: true },
    { header: 'Title Words', group: 'projectConstraints', key: 'titleWords', formatter: wordsFormat, hidden: true },
    { header: 'Summary Words', group: 'projectConstraints', key: 'summaryWords', formatter: wordsFormat, hidden: true },
    { header: 'Specific Objectives', group: 'projectConstraints', key: 'specificObjectives', hidden: true },
    { header: 'Expected Outputs', group: 'projectConstraints', key: 'expectedOutputs', hidden: true },
    { header: 'Themes', group: 'projectConstraints', key: 'themes', hidden: true }
];

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
    ...rangeSpecs.map(rangeColumn)
];

const defaultHiddenColumns: string[] = rangeSpecs.filter((s) => s.hidden).map(fieldOf);

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