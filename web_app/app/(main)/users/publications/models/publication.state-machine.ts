export enum PublicationStatus {
    pending = 'pending',
    verified = 'verified'
}

export const PUBLICATION_STATUS_ORDER: PublicationStatus[] = [
    PublicationStatus.pending,
    PublicationStatus.verified
];

export const PUBLICATION_TRANSITIONS: Record<PublicationStatus, PublicationStatus[]> = {
    [PublicationStatus.pending]: [
        PublicationStatus.verified
    ],

    [PublicationStatus.verified]: [
        PublicationStatus.pending
    ]
};