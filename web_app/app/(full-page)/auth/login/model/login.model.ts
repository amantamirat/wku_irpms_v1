export type LoginDto = {
    user_name: string;
    password: string;
}

export const validateLogin = (login: LoginDto): { valid: boolean; message?: string } => {
    if (!login.user_name || login.user_name.trim() === "") {
        return { valid: false, message: "Username is required." };
    }
     if (!login.password || login.password.trim() === "") {
        return { valid: false, message: "Password is required." };
    }   
    return { valid: true };
};
