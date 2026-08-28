import { VerificationStatus } from "./verification.model";

export const VERIFICATION_STATUS_ORDER: VerificationStatus[] = [
    VerificationStatus.submitted,
    VerificationStatus.verified,
    VerificationStatus.rejected
];

export const VERIFICATION_TRANSITIONS: Record<
    VerificationStatus,
    VerificationStatus[]
> = {
    [VerificationStatus.submitted]: [
        VerificationStatus.verified,
        VerificationStatus.rejected
    ],

    [VerificationStatus.verified]: [
        VerificationStatus.submitted
    ],

    [VerificationStatus.rejected]: [
        VerificationStatus.submitted
    ]
};