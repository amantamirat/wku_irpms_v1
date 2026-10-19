'use client';

import { ColumnProps } from 'primereact/column';
import { useMemo } from 'react';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';

import { User } from '../../models/user.model';

import { ExperienceApi } from '../api/experience.api';
import {
    Experience,
    FilterExperiences
} from '../models/experience.model';


import ExperienceForm from './ExperienceForm';

interface ExperienceManagerProps {
    user?: User;
}

const columns: ColumnProps[] = [
    {
        header: 'Member / Staff',
        field: 'user.name',
        sortable: true,
        body: (experience: Experience) =>
            typeof experience.user === 'object'
                ? experience.user?.name
                : experience.user
    },
    {
        header: 'Organization',
        field: 'organization.name',
        sortable: true,
        body: (experience: Experience) =>
            typeof experience.organization === 'object'
                ? experience.organization?.name
                : experience.organization
    },
    {
        header: 'Position',
        field: 'position.name',
        sortable: true,
        body: (experience: Experience) =>
            typeof experience.position === 'object'
                ? experience.position?.name
                : experience.position
    },
    {
        header: 'Employment Type',
        field: 'employmentType',
        sortable: true,
        body: (experience: Experience) =>
            experience.employmentType || 'N/A'
    },
    {
        header: 'Start Date',
        field: 'startDate',
        sortable: true,
        body: (experience: Experience) =>
            experience.startDate
                ? new Date(experience.startDate).toLocaleDateString()
                : 'N/A'
    },
    {
        header: 'End Date',
        field: 'endDate',
        sortable: true,
        body: (experience: Experience) =>
            experience.isCurrent
                ? 'Present'
                : experience.endDate
                    ? new Date(experience.endDate).toLocaleDateString()
                    : 'N/A'
    },
    {
        header: 'Current',
        field: 'isCurrent',
        sortable: true,
        body: (experience: Experience) =>
            experience.isCurrent ? 'Yes' : 'No'
    }
];

const defaultHiddenColumns = [
    'employmentType',
    'startDate',
    'endDate',
    'isCurrent'
];

const ExperienceManager = ({ user }: ExperienceManagerProps) => {
    const toast = useToast();

    const filter = useMemo<FilterExperiences>(
        () => ({ user }),
        [user]
    );

    return (
        <ItemManager<Experience, FilterExperiences>
            api={ExperienceApi}
            resource="experience"
            itemName="Experience"
            headerTitle={
                user
                    ? `Experience for ${user.name}`
                    : 'Manage Experiences'
            }
            columns={
                user
                    ? columns.filter(
                        (column) => column.field !== 'user.name'
                    )
                    : columns
            }
            enableColumnToggle
            defaultHiddenFields={defaultHiddenColumns}
            filter={filter}
            dialogWidth="650px"
            renderForm={(props) => (
                <ExperienceForm
                    {...props}
                    item={{
                        ...props.item,
                        user: user ?? props.item?.user
                    }}
                />
            )}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Experience created successfully'
                        : 'Experience updated successfully'
                )
            }
        />
    );
};

export default ExperienceManager;
