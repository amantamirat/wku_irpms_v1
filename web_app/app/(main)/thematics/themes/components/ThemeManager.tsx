'use client';

import { ColumnProps } from 'primereact/column';
import { useMemo } from 'react';

import {
    ItemManager,
    ItemManagerProps
} from '@/components/ItemManager';

import { useToast } from '@/contexts/ToastContext';
import { Thematic, ThemeLevel } from '../../models/thematic.model';
import { ThemeApi } from '../api/theme.api';
import { FilterThemes, Theme } from '../models/theme.model';

import ThemeForm from './ThemeForm';

interface ThemeManagerProps {
    thematic?: Thematic;
    level?: number;
    parent?: Theme;
}

// Defined outside the component for a stable reference.
const columns: ColumnProps[] = [
    {
        header: 'Title',
        field: 'title',
        sortable: true
    },
    {
        header: 'Priority',
        field: 'priority',
        sortable: true,
        style: { width: '120px' }
    }
];



const ThemeManager = ({
    thematic,
    level,
    parent
}: ThemeManagerProps) => {
    const toast = useToast();

    const tableProps: ItemManagerProps<
        Theme,
        FilterThemes
    >['tableProps'] = useMemo(
        () => ({
            expandable: {
                template: (row) => {
                    const currentLevel = row.level ?? 0;
                    const thematicLevel = thematic?.level;

                    // Broad: no further nesting.
                    if (thematicLevel === ThemeLevel.broad) {
                        return undefined;
                    }

                    // Division: maximum depth is level 1.
                    if (
                        thematicLevel === ThemeLevel.divison &&
                        currentLevel >= 1
                    ) {
                        return undefined;
                    }

                    // Narrow: maximum depth is level 2.
                    if (
                        thematicLevel === ThemeLevel.narrow &&
                        currentLevel >= 2
                    ) {
                        return undefined;
                    }

                    // Deep: maximum depth is level 3.
                    if (
                        thematicLevel === ThemeLevel.deep &&
                        currentLevel >= 3
                    ) {
                        return undefined;
                    }

                    return (
                        <ThemeManager
                            thematic={thematic}
                            parent={row}
                        //level={level}
                        />
                    );
                }
            }
        }),
        [thematic]
    );


    const filter = useMemo<FilterThemes>(() => ({ level, parent, thematicArea: thematic }), [level, parent, thematic]);

    return (
        <ItemManager<Theme, FilterThemes>
            api={ThemeApi}
            resource="theme"
            itemName="Theme"
            headerTitle="Manage Themes"
            columns={columns}
            filter={filter}
            tableProps={tableProps}
            dialogWidth="500px"
            renderForm={(props) => <ThemeForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Theme created successfully'
                        : 'Theme updated successfully'
                )
            }
        />
    );
};

export default ThemeManager;