'use client';

import { ComponentType } from 'react';
import { PhaseActivityType } from '../models/phase-activity.model';

import { DataCollectionDetailForm } from './activity-details/DataCollectionDetailForm';
import { TrainingWorkshopDetailForm } from './activity-details/TrainingWorkshopDetailForm';
import { MeetingDetailForm } from './activity-details/MeetingDetailForm';
import { TransportationDetailForm } from './activity-details/TransportationDetailForm';
import { AnalysisDetailForm } from './activity-details/AnalysisDetailForm';
import { FieldVisitDetailForm } from './activity-details/FieldVisitDetailForm';
import { DisseminationDetailForm } from './activity-details/DisseminationDetailForm';
import { DevelopmentDetailForm } from './activity-details/DevelopmentDetailForm';
import { OtherDetailForm } from './activity-details/OtherDetailForm';

type DetailFormProps = {
    details: any;
    onChange: (details: any) => void;
    disabled?: boolean;
};

const DETAIL_FORMS: Record<PhaseActivityType, ComponentType<DetailFormProps>> = {
    [PhaseActivityType.DATA_COLLECTION]: DataCollectionDetailForm,
    [PhaseActivityType.TRAINING_WORKSHOP]: TrainingWorkshopDetailForm,
    [PhaseActivityType.MEETING]: MeetingDetailForm,
    [PhaseActivityType.TRANSPORTATION]: TransportationDetailForm,
    [PhaseActivityType.ANALYSIS]: AnalysisDetailForm,
    [PhaseActivityType.FIELD_VISIT]: FieldVisitDetailForm,
    [PhaseActivityType.DISSEMINATION]: DisseminationDetailForm,
    [PhaseActivityType.DESIGN]: DevelopmentDetailForm,
    [PhaseActivityType.OTHER]: OtherDetailForm,
};

interface Props {
    kind: PhaseActivityType;
    details?: any;
    onChange?: (details: any) => void;
    disabled?: boolean;
}

export const ActivityDetailFields = ({
    kind,
    details,
    onChange = () => { },
    disabled
}: Props) => {
    const Form = DETAIL_FORMS[kind];
    if (!Form) return null;

    return <Form details={details ?? {}} onChange={onChange} disabled={disabled} />;
};