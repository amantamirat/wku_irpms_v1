import { AuthApi } from "@/app/(full-page)/auth/api/auth.service";
import { ApiError } from "./ApiError";
import { extractId } from "@/utils/extractId";


export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
        return AuthApi.getToken();
    }
    return null;
};

const handleError = async (response: Response) => {
    if (response.ok) {
        return response;
    }

    const errorMessage =
        `Request failed with status ${response.status}`;

    let errorData: any = null;

    try {
        errorData = await response.json();
    } catch {
        // Response body is not JSON
    }

    const apiError = new ApiError(
        errorData?.message || errorMessage,
        {
            code: errorData?.code,
            details: errorData?.details,
            status: response.status
        }
    );

    // Authentication token is missing, expired, or invalid
    if (
        response.status === 401 &&
        [
            "TOKEN_MISSING",
            "TOKEN_EXPIRED",
            "TOKEN_INVALID"
        ].includes(errorData?.code)
    ) {
        console.log(
            `[ApiClient] Authentication failed: ${errorData.code}`
        );

        if (typeof window !== "undefined") {
            AuthApi.logout();
            window.location.href = "/auth/login";
        }
    }

    throw apiError;
};

export const ApiClient = {
    async get<T = any>(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<T> {
        let url = `${BASE_URL}${endpoint}`;

        if (params) {
            const searchParams = new URLSearchParams();

            Object.entries(params).forEach(([key, rawValue]) => {
                // 1. Handle dates first
                if (rawValue instanceof Date) {
                    searchParams.append(key, rawValue.toISOString());
                    return;
                }

                // 2. Extract _id if rawValue is a populated object
                const value = extractId(rawValue);

                // 3. Omit undefined, null, or empty string values
                if (value !== undefined && value !== null && value !== "") {
                    searchParams.append(key, String(value));
                }
            });

            const queryString = searchParams.toString();
            if (queryString) {
                // Safely appends parameters regardless of existing query strings
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
