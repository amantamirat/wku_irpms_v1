import { User, Gender } from "./user.model";

export const userTemplate = (user: User) => {
    return (
        <span>
            {user.gender === Gender.Male ? 'Mr.' : 'Miss.'} {user.name}
        </span>
    );
};