import { TransitionAction } from '@/hooks/useStateTransitionActions';

export enum PublicationStatus {
    pending = 'pending',
    verified = 'verified'
}

export const PUBLICATION_TRANSITIONS: Record<
    PublicationStatus,
    TransitionAction[]
> = {
    [PublicationStatus.pending]: [
        {
            next: PublicationStatus.verified,
            action: 'Verify',
            icon: 'pi pi-check-circle',
            severity: 'success'
        }
    ],

    [PublicationStatus.verified]: [
        {
            next: PublicationStatus.pending,
            action: 'Revert to Pending',
            icon: 'pi pi-history',
            severity: 'warning',
            requireReason: true
        }
    ]
};