'use client';

import { ColumnProps } from 'primereact/column';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { User } from '../../models/user.model';
import { EnrollmentApi } from '../api/enrollment.api';
import {
    Enrollment,
    FilterEnrollments
} from '../models/enrollment.model';
import EnrollmentForm from './EnrollmentForm';
import { Organization } from '@/app/(main)/organizations/models/organization.model';
import { useMemo } from 'react';

interface EnrollmentManagerProps {
    student?: User;
}

const columns: ColumnProps[] = [
    {
        header: 'Calendar',
        field: 'calendar.year',
        sortable: true,
        body: (enrollment: Enrollment) =>
            typeof enrollment.calendar === 'object'
                ? enrollment.calendar?.year
                : enrollment.calendar
    },
    {
        header: 'Program',
        field: 'program.name',
        sortable: true,
        body: (enrollment: Enrollment) =>
            typeof enrollment.program === 'object'
                ? enrollment.program?.name
                : enrollment.program
    },
    {
        header: 'Academic Level',
        field: 'program.academicLevel',
        sortable: true,
        body: (enrollment: Enrollment) => {
            const program =
                typeof enrollment.program === 'object'
                    ? (enrollment.program as Organization)
                    : null;

            const level = program?.academicLevel;

            return level ? (
                <span
                    className={`academic-badge level-${level.toLowerCase()}`}
                >
                    {level}
                </span>
            ) : null;
        }
    },
    {
        header: 'Student',
        field: 'student.name',
        sortable: true,
        body: (enrollment: Enrollment) =>
            typeof enrollment.student === 'object'
                ? enrollment.student?.name
                : enrollment.student
    }
];



const EnrollmentManager = ({ student }: EnrollmentManagerProps) => {
    const toast = useToast();

    const filter = useMemo<FilterEnrollments>(() => ({ student }), [student]);

    return (
        <ItemManager<Enrollment, FilterEnrollments>
            api={EnrollmentApi}
            resource="enrollment"
            itemName="Enrollment"
            headerTitle={
                student
                    ? `Enrollments for ${student.name}`
                    : 'Manage Enrollments'
            }
            columns={student
                ? columns.filter((column) => column.field !== 'student.name')
                : columns}
            filter={filter}
            dialogWidth="600px"
            renderForm={(props) => (
                <EnrollmentForm
                    {...props}
                    item={{
                        ...props.item,
                        student: student ?? props.item?.student
                    }}
                />
            )}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Enrollment created successfully'
                        : 'Enrollment updated successfully'
                )
            }
        />
    );
};

export default EnrollmentManager;