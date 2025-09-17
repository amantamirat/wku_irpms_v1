import { Applicant, Gender } from "./applicant.model";

export const applicantTemplate = (app: Applicant) => {
    if (!app) return null;
    return (
        <span>
            {app.gender === Gender.Male ? 'Mr.' : 'Miss'} {app.first_name} {app.last_name}
        </span>
    );
};