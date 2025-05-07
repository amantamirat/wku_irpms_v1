export type College = {
    _id?: string;
    college_name: string;
    number_of_departments: number;
};

export const validateCollege = (college: College): boolean => {
    if (college.college_name.trim() === "") {
        return false;
    }
    return true;
};