import { AuthApi } from "@/app/(full-page)/auth/api/auth.api";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
        return AuthApi.getToken();
    }
    return null;
};

const handleError = async (response: Response) => {
    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            const text = await response.text();
            if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
    }
    return response;
};

export const ApiClient = {
    async get(endpoint: string): Promise<any> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();

        try {
            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                cache: "no-store",
            });

            await handleError(response);
            const result = await response.json().catch(() => ({}));
            return result.data ?? result;
        } catch (error) {
            console.error("[ApiClient.get] Error:", error);
            throw error;
        }
    },

    async post(endpoint: string, payload: any): Promise<any> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();
        const isFormData = payload instanceof FormData;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                    ...(!isFormData && { "Content-Type": "application/json" }),
                },
                body: isFormData ? payload : JSON.stringify(payload),
            });
            await handleError(response);
            const result = await response.json().catch(() => ({}));
            return result.data ?? result;
        } catch (error) {
            console.error("[ApiClient.post] Error:", error);
            throw error;
        }
    },

    async put(endpoint: string, payload?: any): Promise<any> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();

        try {
            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: payload ? JSON.stringify(payload) : undefined,
            });

            await handleError(response);
            const result = await response.json().catch(() => ({}));
            return result.data ?? result;
        } catch (error) {
            console.error("[ApiClient.put] Error:", error);
            throw error;
        }
    },

    async patch(endpoint: string, payload?: any): Promise<any> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();

        try {
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: payload ? JSON.stringify(payload) : undefined,
            });

            await handleError(response);
            const result = await response.json().catch(() => ({}));
            return result.data ?? result;
        } catch (error) {
            console.error("[ApiClient.patch] Error:", error);
            throw error;
        }
    },

    async delete(endpoint: string, payload?: any): Promise<any> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();
        try {
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: payload ? JSON.stringify(payload) : undefined,
            });
            await handleError(response);
            const result = await response.json().catch(() => ({}));
            return result.data ?? result;
        } catch (error) {
            console.error("[ApiClient.delete] Error:", error);
            throw error;
        }
    },
};
