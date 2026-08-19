import { VerificationConfigurationStatus } from "./verification-conf.model";


export const VERIFICATION_CONFIG_STATUS_ORDER: VerificationConfigurationStatus[] = [
    VerificationConfigurationStatus.active,
    VerificationConfigurationStatus.closed
];

export const VERIFICATION_CONFIG_TRANSITIONS: Record<
    VerificationConfigurationStatus,
    VerificationConfigurationStatus[]
> = {
    [VerificationConfigurationStatus.active]: [VerificationConfigurationStatus.closed],
    [VerificationConfigurationStatus.closed]: [VerificationConfigurationStatus.active]
};