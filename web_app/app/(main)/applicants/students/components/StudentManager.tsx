'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { StudentApi } from "../api/student.api";
import { Student } from "../models/student.model";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import SaveStudentDialog from "./SaveStudentDialog";
import { Applicant } from "../../models/applicant.model";

interface StudentManagerProps {
    applicant: Applicant;
}

const StudentManager = ({ applicant }: StudentManagerProps) => {

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.STUDENT.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.STUDENT.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.STUDENT.DELETE]);

    // CRUD hook
    const {
        items: students,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Student>();

    const emptyStudent: Student = {
        applicant: applicant,
    };


    const [student, setStudent] = useState<Student>({});
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch students */
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await StudentApi.getStudents({ applicant });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch students. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [applicant]);

    /** Save callback */
    const onSaveComplete = (saved: Student) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete function */
    const deleteStudent = async (row: Student) => {
        const ok = await StudentApi.delete(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        // setStudent({});
        setShowSaveDialog(false);
    };

    /** Columns */
    const columns = [
        { header: "Calendar", field: "calendar.year" },
        { header: "Program", field: "program.name" },
       // { header: "Ac. Level", field: "program.academicLevel" },
        {
            header: "Ac. Level",
            field: "academicLevel",
            sortable: true,
            body: (s: Student) => (
                <span className={`academic-badge level-${(s.program as any).academicLevel.toLowerCase()}`}>
                    {(s.program as any).academicLevel}
                </span>
            )
        },
        !applicant && { header: "Student", field: "applicant.name" },
    ].filter(Boolean);

    return (
        <>
            <CrudManager
                headerTitle="Manage Enrollments"
                //itemName="Student"
                items={students}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => {
                    setStudent(emptyStudent);
                    setShowSaveDialog(true);
                }}

                onEdit={(row) => {
                    setStudent({ ...row });
                    setShowSaveDialog(true);
                }}

                onDelete={(row) =>
                    confirm.ask({
                        item: row._id,
                        onConfirmAsync: () => deleteStudent(row)
                    })
                }

                enableSearch
            />

            {/*  */}

            {(student && showSaveDialog) && (
                <SaveStudentDialog
                    visible={showSaveDialog}
                    student={student}
                    applicantProvided={!!applicant}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default StudentManager;
