'use client';

import React from 'react';
import { createEntityManager } from "@/components/createEntityManager";
import { EnrollmentApi } from "../api/enrollment.api";
import { GetEnrollmentsOptions, Enrollment } from "../models/enrollment.model";
import { User } from "../../models/user.model";
import SaveEnrollmentDialog from "./SaveEnrollment";
import { Organization } from "@/app/(main)/organizations/models/organization.model";

interface EnrollmentManagerProps {
    student?: User;
}

const EnrollmentManager = ({ student: student }: EnrollmentManagerProps) => {
    /**
     * Create the manager instance.
     * We pass User as the Context type to handle the optional applicant filtering.
     */
    const Manager = createEntityManager<Enrollment, GetEnrollmentsOptions | undefined>({
        title: student ? `Enrollments for ${student.name}` : "Manage All Enrollments",
        itemName: "Enrollments",
        api: EnrollmentApi,

        /** Columns configuration */
        columns: [
            {
                header: "Calendar",
                field: "calendar.year",
                sortable: true
            },
            {
                header: "Program",
                field: "program.name",
                sortable: true
            },
            {
                header: "Ac. Level",
                field: "program.academicLevel",
                sortable: true,
                body: (s: Enrollment) => {
                    const level = (s.program as Organization)?.academicLevel;
                    return level ? (
                        <span className={`academic-badge level-${level.toLowerCase()}`}>
                            {level}
                        </span>
                    ) : null;
                }
            },
            // Only show the Student name column if we aren't already filtered by applicant
            ...(!student ? [{
                header: "Student",
                field: "student.name",
                sortable: true
            }] : []),
        ],

        /** Factory for new records */
        createNew: () => ({
            student: student, // Pre-link the student to the applicant context
            calendar: undefined,
            program: undefined
        }),

        /** Dialog and Permissions */
        SaveDialog: SaveEnrollmentDialog,
        permissionPrefix: "enrollment",
    });

    // We pass the applicant prop as the 'context' to the Manager
    return <Manager />;
};

export default EnrollmentManager;