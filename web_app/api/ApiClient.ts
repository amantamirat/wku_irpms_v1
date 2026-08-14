import { AuthApi } from "@/app/(full-page)/auth/api/auth.service";
import { ApiError } from "./ApiError";


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

            throw new ApiError(
                errorData.message || errorMessage,
                {
                    code: errorData.code,
                    details: errorData.details,
                    status: response.status
                }
            );

        } catch (error) {
            // If it is already ApiError, preserve it
            if (error instanceof ApiError) {
                throw error;
            }
            const text = await response.text();
            throw new ApiError(
                text || errorMessage,
                {
                    status: response.status
                }
            );
        }
    }
    return response;
};

export const ApiClient = {
    async get<T = any>(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<T> {
        let url = `${BASE_URL}${endpoint}`;

        if (params) {
            const searchParams = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                // Automatically ignore undefined, null, or empty string values
                if (value !== undefined && value !== null && value !== "") {
                    if (value instanceof Date) {
                        searchParams.append(key, value.toISOString());
                    } else {
                        searchParams.append(key, String(value));
                    }
                }
            });

            const queryString = searchParams.toString();
            if (queryString) {
                // Appends safely whether or not endpoint already contains '?'
                url += (url.includes("?") ? "&" : "?") + queryString;
            }
        }

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
            return (result.data ?? result) as T;
        } catch (error) {
            console.log("[ApiClient.get] Error:", error);
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
            console.log("[ApiClient.post] Error:", error);
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
            console.log("[ApiClient.put] Error:", error);
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
            console.log("[ApiClient.patch] Error:", error);
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
            console.log("[ApiClient.delete] Error:", error);
            throw error;
        }
    },
};
