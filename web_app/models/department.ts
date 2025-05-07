import { validateCollege, type College } from './college';

export type Department = {
    _id?: string;
    department_name: string;
    college: string | College;
};

export const validateDepartment = (department: Department): boolean => {
    const collegeValid =
        typeof department.college === 'string'
            ? department.college.trim() !== ''
            : validateCollege(department.college);

    if (!department.department_name.trim() || !collegeValid) {
        return false;
    }
    return true;
};
