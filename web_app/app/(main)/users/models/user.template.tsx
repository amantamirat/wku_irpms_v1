import { User, Gender } from "./user.model";

export const userTemplate = (user: User) => {
    if (!user) return null;
    return (
        <span>
            {user.gender === Gender.Male ? 'Mr.' : 'Miss'} {user.name}
        </span>
    );
};