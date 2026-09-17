"use client";
import { ApiError } from "@/api/ApiError";

interface ErrorStateProps {
    title?: string;
    error?: ApiError | string | null;
    description?: string;
    onRetry?: () => void;
    imageSrc?: string;
    className?: string;
}

export function ErrorState({
    title,
    error,
    description,
    onRetry,
    imageSrc = "/images/asset-error.svg",
    className = "",
}: ErrorStateProps) {
    /**
     * Primary user-facing message.
     *
     * Priority:
     * 1. Explicit description
     * 2. String error
     * 3. ApiError.message
     * 4. Fallback message
     */
    const errorMessage =
        description ||
        (typeof error === "string"
            ? error
            : error?.message) ||
        "An unexpected error occurred. Please try again.";

    /**
     * Optional additional details.
     *
     * Only show details when they are a useful string
     * and are different from the primary message.
     */
    const errorDetails =
        error instanceof ApiError &&
            typeof error.details === "string"
            ? error.details
            : null;

    /**
     * Use the HTTP status as the title when available.
     */
    const displayTitle =
        title ||
        (error instanceof ApiError && error.status
            ? `Error ${error.status}`
            : "Error Occurred");

    return (
        <div
            className={`flex flex-column align-items-center justify-content-center text-center p-5 ${className}`}
        >
            <div
                className="flex justify-content-center align-items-center bg-pink-500 border-circle mb-3 shadow-2"
                style={{
                    height: "3.5rem",
                    width: "3.5rem",
                }}
            >
                <i className="pi pi-exclamation-circle text-3xl text-white" />
            </div>

            <h2 className="text-900 font-bold text-2xl md:text-3xl mb-2">
                {displayTitle}
            </h2>

            <p className="text-600 line-height-3 mb-1 max-w-28rem font-medium">
                {errorMessage}
            </p>

            {errorDetails &&
                errorDetails !== errorMessage && (
                    <span className="text-500 text-sm mb-4 block">
                        {errorDetails}
                    </span>
                )}

            {imageSrc && (
                <div className="flex justify-content-center mb-4 mt-2">
                    <img
                        src={imageSrc}
                        alt="Error Illustration"
                        style={{
                            width: "60%",
                            maxWidth: "240px",
                            height: "auto",
                        }}
                    />
                </div>
            )}

            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="p-button p-component p-button-outlined p-button-secondary p-button-sm"
                >
                    <i className="pi pi-refresh mr-2" />
                    Try Again
                </button>
            )}
        </div>
    );
}

export default ErrorState;
