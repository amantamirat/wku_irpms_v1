'use client';

import { Message } from 'primereact/message';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { classNames } from 'primereact/utils';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { ProjectApi } from '@/app/(main)/projects/api/project.api';
import { Project } from '@/app/(main)/projects/models/project.model';
import { ItemFormRenderProps } from '@/components/ItemManager';
import { ValidationReport } from '@/components/ValidationErrorReport';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { StageApi } from '../../calls/stages/api/stage.api';
import { Stage } from '../../calls/stages/models/stage.model';
import { ApplicationApi } from '../api/application.api';
import { Application } from '../models/application.model';

interface ApplicationFormProps extends ItemFormRenderProps<Application> {
    project?: Project | string | null;
}

const emptyApplication = {
    project: '',
    stage: undefined,
    file: undefined
} as Application;

/* ------------------------------------------------------------------ */
/* Eligibility state                                                   */
/* ------------------------------------------------------------------ */

type Eligibility =
    | { state: 'loading' }
    | { state: 'eligible'; stage: Stage }
    | { state: 'blocked'; message: string; currentOrder: number }
    | { state: 'completed' }
    | { state: 'error'; message: string };

type StepStatus = 'done' | 'active' | 'pending' | 'locked';

const idOf = (value: any): string | undefined =>
    !value ? undefined : typeof value === 'string' ? value : value._id;

const daysUntil = (date: Date | string) =>
    Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

const StageStepper = ({
    stages,
    getStatus
}: {
    stages: Stage[];
    getStatus: (stage: Stage) => StepStatus;
}) => {
    const styles: Record<StepStatus, { circle: string; label: string; icon: string }> = {
        done: { circle: 'bg-green-500 text-white', label: 'text-900', icon: 'pi pi-check' },
        active: { circle: 'bg-primary text-white shadow-4', label: 'text-primary font-bold', icon: 'pi pi-send' },
        pending: { circle: 'bg-orange-400 text-white', label: 'text-orange-700', icon: 'pi pi-hourglass' },
        locked: { circle: 'surface-200 text-500', label: 'text-500', icon: 'pi pi-lock' }
    };

    return (
        <div className="flex align-items-start overflow-x-auto py-2">
            {stages.map((stage, idx) => {
                const status = getStatus(stage);
                const s = styles[status];
                const isLast = idx === stages.length - 1;

                return (
                    <div key={stage._id ?? idx} className="flex align-items-start flex-1" style={{ minWidth: '5.5rem' }}>
                        <div className="flex flex-column align-items-center text-center" style={{ width: '100%' }}>
                            <div
                                className={classNames(
                                    'flex align-items-center justify-content-center border-circle transition-all transition-duration-300',
                                    s.circle
                                )}
                                style={{ width: '2.5rem', height: '2.5rem' }}
                            >
                                <i className={s.icon}></i>
                            </div>
                            <span className={classNames('text-xs mt-2 px-1', s.label)}>{stage.name}</span>
                        </div>

                        {!isLast && (
                            <div
                                className={classNames(
                                    'flex-shrink-0 mt-3',
                                    status === 'done' ? 'bg-green-500' : 'surface-300'
                                )}
                                style={{ height: '3px', width: '2rem', borderRadius: '2px' }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const DeadlineTag = ({ deadline }: { deadline: Date | string }) => {
    const days = daysUntil(deadline);

    if (days < 0) return <Tag severity="danger" icon="pi pi-exclamation-circle" value="Deadline passed" />;
    if (days <= 3) return <Tag severity="warning" icon="pi pi-clock" value={days === 0 ? 'Due today' : `${days} day${days > 1 ? 's' : ''} left`} />;
    return <Tag severity="success" icon="pi pi-calendar" value={`${days} days left`} />;
};

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

const ApplicationForm = ({ mode, item, saving, formId, onSubmit, project }: ApplicationFormProps) => {
    const [localItem, setLocalItem] = useState<Application>(item ?? emptyApplication);
    const [projectData, setProjectData] = useState<Project | null>(null);
    const [stages, setStages] = useState<Stage[]>([]);
    const [eligibility, setEligibility] = useState<Eligibility>({ state: 'loading' });
    const [submitted, setSubmitted] = useState(false);

    const { error, templateValidation, validationResult: constraintValidation, handleError, clearErrors } =
        useValidationErrors();

    const isEdit = !!item?._id;
    const projectRef = project ?? item?.project ?? null;
    const projectKey = idOf(projectRef);

    useEffect(() => {
        setLocalItem({
            ...(item ?? emptyApplication),
            project: projectRef ?? ''
        } as Application);

        setSubmitted(false);
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item, projectKey, clearErrors]);

    /* Resolve the project, its call stages and the next eligible stage */
    useEffect(() => {
        let cancelled = false;

        const resolve = async () => {
            if (!projectRef) {
                setEligibility({ state: 'error', message: 'No project selected.' });
                return;
            }

            setEligibility({ state: 'loading' });

            try {
                // 1. Project (may be passed as an id)
                const proj: Project =
                    typeof projectRef === 'string' ? await ProjectApi.getById!(projectRef) : projectRef;

                const callId = idOf((proj as any).call);
                if (!callId) throw new Error('This project is not linked to a call.');

                // 2. Stages of the call, ordered
                const callStages = [...(await StageApi.lookup!({ call: callId }))].sort(
                    (a, b) => a.order - b.order
                );

                if (cancelled) return;
                setProjectData(proj);
                setStages(callStages);

                if (callStages.length === 0) {
                    setEligibility({ state: 'error', message: 'This call has no stages configured.' });
                    return;
                }

                // Editing: keep the application's own stage
                if (isEdit) {
                    const own = callStages.find((s) => s._id === idOf(item?.stage));
                    setEligibility(
                        own
                            ? { state: 'eligible', stage: own }
                            : { state: 'error', message: 'The stage of this application could not be found.' }
                    );
                    return;
                }

                // 3. Current application of the project (may be an id)
                let current: any = (proj as any).currentApplication;
                if (typeof current === 'string') current = await ApplicationApi.getById!(current);

                if (cancelled) return;

                // No current application -> first stage
                if (!current) {
                    setEligibility({ state: 'eligible', stage: callStages[0] });
                    return;
                }

                const currentStage = callStages.find((s) => s._id === idOf(current.stage));
                const currentOrder = currentStage?.order ?? 0;

                // Must be accepted to move on
                if (String(current.status ?? '').toLowerCase() !== 'accepted') {
                    setEligibility({
                        state: 'blocked',
                        currentOrder,
                        message: `Your application for "${currentStage?.name ?? 'the current stage'}" is ${
                            current.status ?? 'still under review'
                        }. You can apply to the next stage once it is accepted.`
                    });
                    return;
                }

                // Accepted -> next stage by order
                const next = callStages.find((s) => s.order > currentOrder);
                setEligibility(next ? { state: 'eligible', stage: next } : { state: 'completed' });
            } catch (err: any) {
                if (cancelled) return;
                console.error('Failed to resolve eligible stage:', err);
                setEligibility({ state: 'error', message: err?.message || 'Failed to load stage information.' });
            }
        };

        resolve();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectKey, item?._id]);

    /* Stepper statuses */
    const getStepStatus = useMemo(
        () =>
            (stage: Stage): StepStatus => {
                switch (eligibility.state) {
                    case 'eligible': {
                        const target = eligibility.stage;
                        if (stage.order < target.order) return 'done';
                        return stage._id === target._id ? 'active' : 'locked';
                    }
                    case 'blocked':
                        if (stage.order < eligibility.currentOrder) return 'done';
                        return stage.order === eligibility.currentOrder ? 'pending' : 'locked';
                    case 'completed':
                        return 'done';
                    default:
                        return 'locked';
                }
            },
        [eligibility]
    );

    const targetStage = eligibility.state === 'eligible' ? eligibility.stage : null;
    const stageIndex = targetStage ? stages.findIndex((s) => s._id === targetStage._id) + 1 : 0;

    const projectMissing = !localItem.project;
    const stageMissing = !targetStage;
    const fileMissing = !localItem.file && !isEdit;
    const hasErrors = projectMissing || stageMissing || fileMissing;
    const formLocked = saving || eligibility.state !== 'eligible';

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        clearErrors();

        if (saving || hasErrors) return;

        try {
            await onSubmit({ ...localItem, stage: targetStage!._id });
        } catch (err) {
            handleError(err);
        }
    };

    const handleFileSelect = (e: FileUploadSelectEvent) => {
        const file = e.files?.[0];
        if (file) {
            setLocalItem((prev) => ({ ...prev, file }));
            clearErrors();
        }
    };

    const handleFileClear = () => {
        setLocalItem((prev) => ({ ...prev, file: undefined }));
        clearErrors();
    };

    const projectTitle = (projectData as any)?.title ?? (projectData as any)?.name;

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            <div className="grid">
                {/* Server validation report */}
                <div className="col-12">
                    <ValidationReport
                        error={error}
                        templateValidation={templateValidation}
                        validationResult={constraintValidation}
                    />
                </div>

                {/* 1. Project */}
                <div className="col-12">
                    <span className="text-xs font-semibold text-500 uppercase block mb-2">Project</span>

                    {eligibility.state === 'loading' && !projectData ? (
                        <Skeleton height="4.5rem" borderRadius="12px" />
                    ) : (
                        <div
                            className="flex align-items-center gap-3 p-3 border-round-xl border-1 surface-border"
                            style={{ background: 'linear-gradient(135deg, var(--primary-50, #eef2ff) 0%, var(--surface-0) 100%)' }}
                        >
                            <div
                                className="flex align-items-center justify-content-center bg-primary text-white border-round-lg flex-shrink-0"
                                style={{ width: '3rem', height: '3rem' }}
                            >
                                <i className="pi pi-briefcase text-xl"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                                    {projectTitle ?? 'Selected project'}
                                </div>
                                <small className="text-600">Application will be submitted for this project</small>
                            </div>
                            <i className="pi pi-check-circle text-green-500 text-xl"></i>
                        </div>
                    )}

                    {projectMissing && submitted && (
                        <small className="p-error block mt-2">A project is required. Please provide a project.</small>
                    )}
                </div>

                {/* 2. Stage */}
                <div className="col-12 mt-2">
                    <span className="text-xs font-semibold text-500 uppercase block mb-2">Application stage</span>

                    {eligibility.state === 'loading' && <Skeleton height="9rem" borderRadius="12px" />}

                    {eligibility.state !== 'loading' && stages.length > 0 && (
                        <div className="surface-card border-1 surface-border border-round-xl p-3">
                            <StageStepper stages={stages} getStatus={getStepStatus} />

                            {eligibility.state === 'eligible' && (
                                <div className="mt-3 p-3 border-round-lg border-1 border-primary-200 bg-primary-50 flex flex-column md:flex-row md:align-items-center justify-content-between gap-2">
                                    <div>
                                        <small className="text-600 block">
                                            {isEdit ? 'This application is for' : "You're applying for"}
                                        </small>
                                        <div className="text-lg font-bold text-primary">{eligibility.stage.name}</div>
                                        <small className="text-500">
                                            Stage {stageIndex} of {stages.length}
                                            {eligibility.stage.deadline &&
                                                ` · Deadline ${new Date(eligibility.stage.deadline).toLocaleDateString(undefined, {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}`}
                                        </small>
                                    </div>
                                    {eligibility.stage.deadline && <DeadlineTag deadline={eligibility.stage.deadline} />}
                                </div>
                            )}

                            {eligibility.state === 'blocked' && (
                                <Message severity="warn" className="w-full mt-3 justify-content-start" text={eligibility.message} />
                            )}

                            {eligibility.state === 'completed' && (
                                <Message
                                    severity="success"
                                    className="w-full mt-3 justify-content-start"
                                    text="All stages of this call are completed. There is nothing left to apply for."
                                />
                            )}
                        </div>
                    )}

                    {eligibility.state === 'error' && (
                        <Message severity="error" className="w-full mt-2 justify-content-start" text={eligibility.message} />
                    )}
                </div>

                {/* 3. File */}
                <div className={classNames('col-12 mt-2 mb-3 transition-all', { 'opacity-50 pointer-events-none': formLocked })}>
                    <span className="text-xs font-semibold text-500 uppercase block mb-2">
                        Application document (PDF) {!isEdit && <span className="text-red-500">*</span>}
                    </span>

                    <FileUpload
                        mode="advanced"
                        name="file"
                        accept="application/pdf"
                        maxFileSize={10000000} // 10MB
                        multiple={false}
                        customUpload
                        auto={false}
                        onSelect={handleFileSelect}
                        onRemove={handleFileClear}
                        onClear={handleFileClear}
                        chooseLabel={localItem.file ? 'Change PDF' : 'Select PDF'}
                        uploadOptions={{ style: { display: 'none' } }}
                        cancelOptions={{ style: { display: 'none' } }}
                        disabled={formLocked}
                        className={classNames({ 'p-invalid': submitted && fileMissing })}
                        emptyTemplate={
                            <div className="flex flex-column align-items-center py-3">
                                <i className="pi pi-cloud-upload p-4 border-2 border-dashed border-300 border-circle text-400 text-3xl"></i>
                                <span className="mt-3 text-600">Drag and drop your PDF here</span>
                                <small className="text-500">Max size 10MB</small>
                            </div>
                        }
                    />

                    {submitted && fileMissing && (
                        <small className="p-error block mt-2">Please select a PDF file.</small>
                    )}
                </div>
            </div>
        </form>
    );
};

export default ApplicationForm;