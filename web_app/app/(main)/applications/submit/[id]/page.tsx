'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from 'primereact/button';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { classNames } from 'primereact/utils';

import { ApplicationStatus, Application } from '@/app/(main)/applications/models/application.model';
import { StageApi } from '@/app/(main)/calls/stages/api/stage.api';
import { Stage } from '@/app/(main)/calls/stages/models/stage.model';
import { ProjectApi } from '@/app/(main)/projects/api/project.api';
import { Project, ProjectStatus } from '@/app/(main)/projects/models/project.model';
import { ValidationReport } from '@/components/ValidationErrorReport';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { ApplicationApi } from '../../api/application.api';
import { extractId } from '@/utils/utils';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */


type ProjectEligibility = {
    project: Project;
    eligible: boolean;
    reason?: string;
};

const DeadlineTag = ({ deadline }: { deadline: Date | string }) => {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) return null;

    const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);

    if (days < 0) return <Tag severity="danger" icon="pi pi-exclamation-circle" value="Deadline passed" />;
    if (days <= 3)
        return (
            <Tag
                severity="warning"
                icon="pi pi-clock"
                value={days === 0 ? 'Due today' : `${days} day${days > 1 ? 's' : ''} left`}
            />
        );
    return <Tag severity="success" icon="pi pi-calendar" value={`${days} days left`} />;
};

const StageDots = ({ stages, currentId }: { stages: Stage[]; currentId?: string }) => {
    const currentIdx = stages.findIndex((s) => s._id === currentId);

    return (
        <div className="flex align-items-center gap-2 mt-3">
            {stages.map((s, i) => (
                <div key={s._id ?? i} className="flex-1" title={s.name}>
                    <div
                        className={classNames('border-round transition-all transition-duration-300', {
                            'bg-green-500': i < currentIdx,
                            'bg-primary': i === currentIdx,
                            'surface-300': i > currentIdx
                        })}
                        style={{ height: '6px' }}
                    />
                    <small
                        className={classNames('block mt-1 white-space-nowrap overflow-hidden text-overflow-ellipsis', {
                            'text-primary font-semibold': i === currentIdx,
                            'text-500': i !== currentIdx
                        })}
                    >
                        {s.name}
                    </small>
                </div>
            ))}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function StageSubmitPage() {
    const params = useParams();
    const router = useRouter();
    const stageId = params?.id as string;

    const [stage, setStage] = useState<Stage | null>(null);
    const [callStages, setCallStages] = useState<Stage[]>([]);
    const [results, setResults] = useState<ProjectEligibility[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const { error, templateValidation, validationResult, handleError, clearErrors } =
        useValidationErrors();

    /* -------------------------------------------------------------- */
    /* Load: stage + call stages + user's projects (in parallel)       */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        if (!stageId) return;
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setLoadError(null);

                const stageData = await StageApi.getById!(stageId);
                const callId = extractId(stageData.call);
                if (!callId) throw new Error('This stage is not linked to a call.');

                const [stagesRaw, userProjects] = await Promise.all([
                    StageApi.lookup!({ call: callId }),
                    ProjectApi.me({ status: ProjectStatus.draft })
                ]);

                const sorted = [...stagesRaw].sort((a, b) => a.order - b.order);
                const index = sorted.findIndex((s) => s._id === stageId);
                const previous = index > 0 ? sorted[index - 1] : null; // resolved locally, no API call
                const nameOf = (id?: string) => sorted.find((s) => s._id === id)?.name ?? 'a previous stage';

                // Only projects that belong to this stage's call
                const callProjects = userProjects.filter((p) => extractId((p as any).call) === callId);

                // Resolve current applications (only fetch the ones that are ids)
                const evaluated = await Promise.all(
                    callProjects.map(async (project:any): Promise<ProjectEligibility> => {
                        let app: Application | null = null;
                        const current = project.currentApplication as any;

                        if (current && typeof current === 'object') app = current;
                        else if (current) app = await ApplicationApi.getById!(current);

                        // No application yet: only the first stage is open
                        if (!app) {
                            return previous
                                ? { project, eligible: false, reason: `Complete "${previous.name}" first` }
                                : { project, eligible: true };
                        }

                        const appStageId = extractId(app.stage);

                        if (appStageId === stageId) {
                            return { project, eligible: false, reason: 'Already submitted for this stage' };
                        }

                        if (previous && appStageId === previous._id) {
                            return app.status === ApplicationStatus.accepted
                                ? { project, eligible: true }
                                : {
                                      project,
                                      eligible: false,
                                      reason: `"${previous.name}" application is ${app.status ?? 'under review'}`
                                  };
                        }

                        return {
                            project,
                            eligible: false,
                            reason: `Currently at "${nameOf(appStageId)}"`
                        };
                    })
                );

                if (cancelled) return;

                setStage(stageData);
                setCallStages(sorted);
                setResults(evaluated);

                const eligible = evaluated.filter((r) => r.eligible);
                if (eligible.length === 1) setSelectedProject(eligible[0].project);
            } catch (err: any) {
                if (!cancelled) setLoadError(err?.message || 'Failed to load stage submission details.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [stageId]);

    const eligible = useMemo(() => results.filter((r) => r.eligible), [results]);
    const ineligible = useMemo(() => results.filter((r) => !r.eligible), [results]);

    /* -------------------------------------------------------------- */
    /* Deadline                                                        */
    /* -------------------------------------------------------------- */
    const deadline = stage?.deadline ? new Date(stage.deadline) : null;
    const isExpired = !!deadline && !isNaN(deadline.getTime()) && deadline.getTime() < Date.now();

    /* -------------------------------------------------------------- */
    /* Handlers                                                        */
    /* -------------------------------------------------------------- */
    const handleFileSelect = (e: FileUploadSelectEvent) => {
        setSelectedFile(e.files[0] ?? null);
        clearErrors();
    };

    const handleFileRemove = () => {
        setSelectedFile(null);
        clearErrors();
    };

    const handleSelectProject = (project: Project) => {
        if (submitting) return;
        setSelectedProject(project);
        clearErrors();
    };

    const handleSubmit = async () => {
        if (!selectedProject || !selectedFile || !stageId) return;

        try {
            setSubmitting(true);
            clearErrors();

            await ApplicationApi.create({
                project: selectedProject._id!,
                stage: stageId,
                file: selectedFile
            });

            setSuccess(true);
            setTimeout(() => router.push('/'), 2000);
        } catch (err: any) {
            console.error('Stage submission failed', err);
            handleError(err);
        } finally {
            setSubmitting(false);
        }
    };

    /* -------------------------------------------------------------- */
    /* States                                                          */
    /* -------------------------------------------------------------- */
    if (loading) {
        return (
            <div className="surface-card border-1 surface-border border-round-xl shadow-1 max-w-4xl mx-auto mt-5 p-5">
                <div className="flex align-items-center gap-3 mb-5">
                    <Skeleton shape="circle" size="3rem" />
                    <div className="flex-1">
                        <Skeleton width="14rem" height="1.4rem" className="mb-2" />
                        <Skeleton width="20rem" height="1rem" />
                    </div>
                </div>
                <Skeleton width="100%" height="6rem" className="mb-4" />
                <Skeleton width="100%" height="10rem" className="mb-4" />
                <Skeleton width="100%" height="8rem" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="surface-card border-1 surface-border border-round-xl shadow-1 max-w-2xl mx-auto mt-6 p-6 text-center">
                <div
                    className="flex align-items-center justify-content-center bg-green-50 text-green-600 border-circle mx-auto mb-4"
                    style={{ width: '5rem', height: '5rem' }}
                >
                    <i className="pi pi-check text-4xl" />
                </div>
                <h2 className="text-900 mt-0 mb-2">Application Submitted</h2>
                <p className="text-600 line-height-3 mb-4">
                    Your application for <strong>{stage?.name}</strong> was submitted successfully and is now ready
                    for review.
                </p>
                <Message severity="success" text="Redirecting to your dashboard..." className="w-full" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="max-w-4xl mx-auto mt-5 px-3">
                <Message severity="error" text={loadError} className="w-full mb-3" />
                <Button label="Go back" icon="pi pi-arrow-left" text onClick={() => router.back()} />
            </div>
        );
    }

    /* -------------------------------------------------------------- */
    /* Render                                                          */
    /* -------------------------------------------------------------- */
    return (
        <div className="max-w-4xl mx-auto mt-5 mb-6 px-3">
            {/* HEADER */}
            <div className="surface-card border-1 surface-border border-round-xl shadow-1 p-4 mb-4">
                <div className="flex align-items-start justify-content-between gap-3">
                    <div className="flex align-items-center gap-3">
                        <div
                            className="flex align-items-center justify-content-center bg-primary text-white border-round-lg flex-shrink-0"
                            style={{ width: '3rem', height: '3rem' }}
                        >
                            <i className="pi pi-send text-xl" />
                        </div>
                        <div>
                            <h2 className="text-900 m-0">{stage?.name ?? 'Submit Application'}</h2>
                            <p className="text-500 m-0 mt-1">
                                Stage {callStages.findIndex((s) => s._id === stageId) + 1} of {callStages.length}
                                {deadline &&
                                    !isNaN(deadline.getTime()) &&
                                    ` · Deadline ${deadline.toLocaleDateString(undefined, {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}`}
                            </p>
                        </div>
                    </div>
                    {stage?.deadline && <DeadlineTag deadline={stage.deadline} />}
                </div>

                <StageDots stages={callStages} currentId={stageId} />
            </div>

            {isExpired && (
                <Message
                    severity="error"
                    text="The deadline for this stage has passed. Submissions are closed."
                    className="w-full mb-4 justify-content-start"
                />
            )}

            {/* SERVER VALIDATION (reused component) */}
            <ValidationReport
                error={error}
                templateValidation={templateValidation}
                validationResult={validationResult}
            />

            {/* PROJECT */}
            <div className="surface-card border-1 surface-border border-round-xl shadow-1 p-4 mb-4">
                <div className="flex align-items-center justify-content-between mb-3">
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-folder-open text-primary" />
                        <div>
                            <div className="font-semibold text-900">Project</div>
                            <div className="text-500 text-sm">Choose the project you want to submit for this stage.</div>
                        </div>
                    </div>
                    {eligible.length > 0 && <Tag value={`${eligible.length} eligible`} severity="success" rounded />}
                </div>

                {eligible.length === 0 ? (
                    <Message
                        severity="warn"
                        className="w-full justify-content-start"
                        text="You have no projects eligible for this stage yet."
                    />
                ) : (
                    <div className="flex flex-column gap-2" style={{ maxHeight: '18rem', overflowY: 'auto' }}>
                        {eligible.map(({ project }) => {
                            const active = selectedProject?._id === project._id;
                            return (
                                <div
                                    key={project._id}
                                    role="radio"
                                    aria-checked={active}
                                    tabIndex={0}
                                    onClick={() => handleSelectProject(project)}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectProject(project)}
                                    className={classNames(
                                        'flex align-items-center gap-3 p-3 border-round-lg border-1 cursor-pointer transition-all transition-duration-200',
                                        active ? 'border-primary bg-primary-50 shadow-2' : 'surface-border hover:surface-100'
                                    )}
                                >
                                    <div
                                        className={classNames(
                                            'flex align-items-center justify-content-center border-circle flex-shrink-0',
                                            active ? 'bg-primary text-white' : 'surface-200 text-500'
                                        )}
                                        style={{ width: '2.25rem', height: '2.25rem' }}
                                    >
                                        <i className={classNames('pi', active ? 'pi-check' : 'pi-briefcase')} />
                                    </div>
                                    <span
                                        className={classNames('flex-1 white-space-nowrap overflow-hidden text-overflow-ellipsis', {
                                            'font-bold text-primary': active,
                                            'text-900 font-medium': !active
                                        })}
                                    >
                                        {project.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {ineligible.length > 0 && (
                    <details className="mt-3">
                        <summary className="text-500 text-sm cursor-pointer">
                            {ineligible.length} other project{ineligible.length > 1 ? 's' : ''} not eligible
                        </summary>
                        <div className="flex flex-column gap-2 mt-2">
                            {ineligible.map(({ project, reason }) => (
                                <div
                                    key={project._id}
                                    className="flex align-items-center justify-content-between gap-3 p-2 border-round surface-50"
                                >
                                    <span className="text-700 text-sm">{project.title}</span>
                                    <small className="text-500 text-right">{reason}</small>
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>

            {/* DOCUMENT */}
            <div
                className={classNames('surface-card border-1 surface-border border-round-xl shadow-1 p-4 mb-4 transition-all', {
                    'opacity-50 pointer-events-none': eligible.length === 0 || isExpired
                })}
            >
                <div className="flex align-items-center gap-2 mb-3">
                    <i className="pi pi-file-pdf text-red-500" />
                    <div>
                        <div className="font-semibold text-900">Submission Document</div>
                        <div className="text-500 text-sm">Upload your stage document as a PDF.</div>
                    </div>
                </div>

                <FileUpload
                    mode="advanced"
                    name="stageFile"
                    accept="application/pdf"
                    maxFileSize={10_000_000}
                    multiple={false}
                    customUpload
                    auto={false}
                    onSelect={handleFileSelect}
                    onRemove={handleFileRemove}
                    onClear={handleFileRemove}
                    chooseLabel={selectedFile ? 'Change PDF' : 'Choose PDF'}
                    uploadOptions={{ style: { display: 'none' } }}
                    cancelOptions={{ style: { display: 'none' } }}
                    disabled={submitting}
                    emptyTemplate={
                        <div className="flex flex-column align-items-center justify-content-center py-5">
                            <div
                                className="flex align-items-center justify-content-center bg-red-50 text-red-500 border-circle mb-3"
                                style={{ width: '4rem', height: '4rem' }}
                            >
                                <i className="pi pi-file-pdf text-2xl" />
                            </div>
                            <span className="font-medium text-700 mb-1">Drop your PDF here</span>
                            <span className="text-500 text-sm">or choose a file from your computer</span>
                            <span className="text-400 text-xs mt-2">PDF only · Maximum 10 MB</span>
                        </div>
                    }
                />
            </div>

            {/* SUMMARY */}
            <div className="surface-50 border-1 surface-border border-round-xl p-4 mb-4">
                <div className="flex align-items-center gap-2 mb-3">
                    <i className="pi pi-list-check text-primary" />
                    <span className="font-semibold text-900">Submission Summary</span>
                </div>

                <div className="flex flex-column gap-3">
                    <div className="flex align-items-center justify-content-between">
                        <span className="text-600">Project</span>
                        <span className="text-900 font-medium text-right ml-3">
                            {selectedProject?.title || 'Not selected'}
                        </span>
                    </div>

                    <div className="flex align-items-center justify-content-between">
                        <span className="text-600">Stage</span>
                        <span className="text-900 font-medium text-right ml-3">{stage?.name}</span>
                    </div>

                    <div className="flex align-items-center justify-content-between">
                        <span className="text-600">Document</span>
                        {selectedFile ? (
                            <span className="text-green-600 font-medium text-right ml-3">
                                <i className="pi pi-check-circle mr-1" />
                                {selectedFile.name}
                            </span>
                        ) : (
                            <span className="text-red-500">
                                <i className="pi pi-times-circle mr-1" />
                                No document selected
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-content-between align-items-center">
                <Button
                    label="Cancel"
                    icon="pi pi-arrow-left"
                    text
                    severity="secondary"
                    onClick={() => router.back()}
                    disabled={submitting}
                />

                <Button
                    label={submitting ? 'Submitting...' : 'Submit Application'}
                    icon={submitting ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
                    iconPos="right"
                    onClick={handleSubmit}
                    disabled={!selectedProject || !selectedFile || submitting || isExpired}
                    className="px-4"
                />
            </div>
        </div>
    );
}