'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Student, validateStudent } from '../models/student.model';
import { useAuth } from '@/contexts/auth-context';
import { Calendar } from '@/app/(main)/calendars/models/calendar.model';
import { Applicant } from '../../models/applicant.model';
import { Organization, OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { CalendarApi } from '@/app/(main)/calendars/api/calendar.api';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { ApplicantApi } from '../../api/applicant.api';
import { StudentApi } from '../api/student.api';



interface SaveStudentDialogProps {
    visible: boolean;
    student: Student;
    applicantProvided: boolean;
    onHide: () => void;
    onComplete?: (savedStudent: Student) => void;
}

const SaveStudentDialog = ({ visible, student, applicantProvided, onHide, onComplete }: SaveStudentDialogProps) => {

    const { hasPermission } = useAuth();

    const [localStudent, setLocalStudent] = useState<Student>({ ...student });
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [programs, setPrograms] = useState<Organization[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);

    // Fetch dropdown data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [calData, progData] = await Promise.all([
                    CalendarApi.getCalendars(),
                    OrganizationApi.getOrganizations({ type: OrgnUnit.Program }),
                ]);
                setCalendars(calData);
                setPrograms(progData);
            } catch (err) {
                console.error('Failed to fetch student-related data:', err);
            }
        };
        fetchData();
    }, []);


    useEffect(() => {
        if (applicantProvided) {
            return;
        }
        const fetchApplicants = async () => {
            try {
                const appData = await ApplicantApi.getApplicants({});
                setApplicants(appData);
            } catch (err) {
                console.error('Failed to fetch applicant data:', err);
            }
        };
        fetchApplicants();
    }, [applicantProvided]);

    // Reset localStudent when prop changes
    useEffect(() => {
        setLocalStudent({ ...student });
    }, [student]);

    // Clear form when dialog closes
    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalStudent({ ...student });
    };

    const saveStudent = async () => {
        try {
            setSubmitted(true);
            const validation = validateStudent(localStudent);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            let saved: Student;
            if (localStudent._id) {
                saved = await StudentApi.update(localStudent);
            } else {
                saved = await StudentApi.create(localStudent);
            }

            saved = { ...localStudent, _id: saved._id }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Student saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 2000);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save student',
                detail: err.message || 'An error occurred',
                life: 2000,
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveStudent} />
        </>
    );

    const isEdit = !!localStudent._id;

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={isEdit ? 'Edit Student' : 'New Student'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
                maximized
            >
                {/* Calendar */}
                <div className="field">
                    <label htmlFor="calendar">Calendar</label>
                    <Dropdown
                        id="calendar"
                        value={localStudent.calendar}
                        options={calendars}
                        optionLabel="year"
                        dataKey="_id"
                        onChange={(e) => setLocalStudent({ ...localStudent, calendar: e.value })}
                        placeholder="Select Calendar"
                        className={classNames({ 'p-invalid': submitted && !localStudent.calendar })}
                    />
                    {submitted && !localStudent.calendar && <small className="p-invalid">Calendar is required.</small>}
                </div>

                {/* Program */}
                <div className="field">
                    <label htmlFor="program">Program</label>
                    <Dropdown
                        id="program"
                        value={localStudent.program}
                        options={programs}
                        optionLabel="name"
                        itemTemplate={(option: Organization) =>
                            option ? `${option.name} (${option.academicLevel})` : ''
                        }
                        dataKey="_id"
                        onChange={(e) => setLocalStudent({ ...localStudent, program: e.value })}
                        placeholder="Select Program"
                        className={classNames({ 'p-invalid': submitted && !localStudent.program })}
                    />
                    {submitted && !localStudent.program && <small className="p-invalid">Program is required.</small>}
                </div>

                {/* Applicant */}
                {!applicantProvided &&
                    <div className="field">
                        <label htmlFor="applicant">Applicant</label>
                        <Dropdown
                            id="applicant"
                            value={localStudent.applicant}
                            options={applicants}
                            optionLabel="name"
                            dataKey="_id"
                            onChange={(e) => setLocalStudent({ ...localStudent, applicant: e.value })}
                            placeholder="Select Applicant"
                            className={classNames({ 'p-invalid': submitted && !localStudent.applicant })}
                        />
                        {submitted && !localStudent.applicant && <small className="p-invalid">Applicant is required.</small>}
                    </div>
                }
            </Dialog>
        </>
    );
};

export default SaveStudentDialog;
