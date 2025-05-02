export type Directorate = {
    _id?: string;
    directorate_name: string;
};

export const validateDirectorate = (directorate: Directorate): boolean => {
    if (directorate.directorate_name.trim() === "") {
        return false;
    }
    return true;
};