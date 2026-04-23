'use client';

import React from 'react';
import { createEntityManager } from "@/components/createEntityManager";
import { StudentApi } from "../api/student.api";
import { GetStudentsOptions, Student } from "../models/student.model";
import { User } from "../../models/user.model";
import SaveStudentDialog from "./SaveStudent";
import { Organization } from "@/app/(main)/organizations/models/organization.model";

interface StudentManagerProps {
    applicant?: User;
}

const StudentManager = ({ applicant }: StudentManagerProps) => {
    /**
     * Create the manager instance.
     * We pass User as the Context type to handle the optional applicant filtering.
     */
    const Manager = createEntityManager<Student, GetStudentsOptions | undefined>({
        title: applicant ? `Enrollments for ${applicant.name}` : "Manage All Enrollments",
        itemName: "Student Enrollment",
        api: StudentApi,

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
                body: (s: Student) => {
                    const level = (s.program as Organization)?.academicLevel;
                    return level ? (
                        <span className={`academic-badge level-${level.toLowerCase()}`}>
                            {level}
                        </span>
                    ) : null;
                }
            },
            // Only show the Student name column if we aren't already filtered by applicant
            ...(!applicant ? [{
                header: "Student",
                field: "user.name",
                sortable: true
            }] : []),
        ],

        /** Factory for new records */
        createNew: () => ({
            user: applicant, // Pre-link the student to the applicant context
            calendar: undefined,
            program: undefined
        }),

        /** Dialog and Permissions */
        SaveDialog: SaveStudentDialog,
        permissionPrefix: "student",
    });

    // We pass the applicant prop as the 'context' to the Manager
    return <Manager />;
};

export default StudentManager;