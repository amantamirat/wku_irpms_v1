import { Applicant, Gender } from "./applicant.model";

export const applicantTemplate = (app: Applicant) => {
    if (!app) return null;
    return (
        <span>
            {app.gender === Gender.Male ? 'Mr.' : 'Miss'} {app.firstName} {app.lastName}
        </span>
    );
};