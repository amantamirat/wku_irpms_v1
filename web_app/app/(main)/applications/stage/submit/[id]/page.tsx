'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';

import { ProjectApi } from '@/app/(main)/projects/api/project.api';
import {
    Project,
    ProjectStatus
} from '@/app/(main)/projects/models/project.model';

import {
    Application,
    ApplicationStatus
} from '@/app/(main)/applications/models/application.model';

import { format } from 'date-fns';
import { Stage } from '@/app/(main)/calls/stages/models/stage.model';
import { StageApi } from '@/app/(main)/calls/stages/api/stage.api';
import { ApplicationApi } from '../../../api/application.api';

export default function StageSubmitPage() {
    const params = useParams();
    const router = useRouter();

    const stageId = params?.id as string;

    const [stage, setStage] = useState<Stage | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] =
        useState<Project | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!stageId) return;

        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load current stage
                const stageData = await StageApi.getById!(stageId);
                setStage(stageData);

                // Load previous stage
                const previousStage = await StageApi.getPrevious(stageId);

                // No previous stage means this is the first stage
                if (!previousStage) {
                    setProjects([]);
                    return;
                }

                // Load user's draft projects
                const userProjects = await ProjectApi.me({
                    status: ProjectStatus.draft
                });

                // Load current applications
                const projectsWithApplications = await Promise.all(
                    userProjects.map(async (project) => {
                        let application: Application | null = null;

                        if (typeof project.currentApplication === 'object') {
                            application =
                                project.currentApplication as Application;
                        } else if (project.currentApplication) {
                            application = await ApplicationApi.getById!(
                                project.currentApplication
                            );
                        }

                        return {
                            project,
                            application
                        };
                    })
                );

                // Only projects whose current application
                // was accepted for the previous stage
                const eligibleProjects = projectsWithApplications
                    .filter(({ application }) => {
                        if (!application) return false;

                        const applicationStage =
                            typeof application.stage === 'object'
                                ? application.stage._id
                                : application.stage;

                        return (
                            application.status === ApplicationStatus.accepted &&
                            String(applicationStage) ===
                            String(previousStage._id)
                        );
                    })
                    .map(({ project }) => project);

                setProjects(eligibleProjects);

                // Automatically select if there is only one
                if (eligibleProjects.length === 1) {
                    setSelectedProject(eligibleProjects[0]);
                }
            } catch (err: any) {
                console.error(
                    'Failed to load stage submission data',
                    err
                );

                setError(
                    err?.message ||
                    'Failed to load stage submission details.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [stageId]);

    const handleFileSelect = (event: FileUploadSelectEvent) => {
        setSelectedFile(event.files[0] ?? null);
        setError(null);
    };

    const handleFileRemove = () => {
        setSelectedFile(null);
        setError(null);
    };

    const handleSubmit = async () => {
        if (!selectedProject || !selectedFile || !stageId) {
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            await ApplicationApi.create({
                project: selectedProject._id!,
                stage: stageId,
                file: selectedFile
            });

            setSuccess(true);

            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err: any) {
            console.error('Stage submission failed', err);

            setError(
                err?.message ||
                'Stage submission failed. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="surface-card border-1 surface-border border-round-xl shadow-1 max-w-4xl mx-auto mt-5 p-5">
                <div className="flex align-items-center gap-3 mb-5">
                    <Skeleton shape="circle" size="3rem" />

                    <div className="flex-1">
                        <Skeleton
                            width="14rem"
                            height="1.4rem"
                            className="mb-2"
                        />

                        <Skeleton
                            width="20rem"
                            height="1rem"
                        />
                    </div>
                </div>

                <Skeleton
                    width="100%"
                    height="8rem"
                    className="mb-4"
                />

                <Skeleton
                    width="100%"
                    height="10rem"
                    className="mb-4"
                />

                <Skeleton
                    width="100%"
                    height="8rem"
                />
            </div>
        );
    }

    if (success) {
        return (
            <div className="surface-card border-1 surface-border border-round-xl shadow-1 max-w-2xl mx-auto mt-6 p-6 text-center">
                <div
                    className="flex align-items-center justify-content-center bg-green-50 text-green-600 border-circle mx-auto mb-4"
                    style={{
                        width: '5rem',
                        height: '5rem'
                    }}
                >
                    <i className="pi pi-check text-4xl" />
                </div>

                <h2 className="text-900 mt-0 mb-2">
                    Stage Submitted
                </h2>

                <p className="text-600 line-height-3 mb-4">
                    Your stage submission has been submitted
                    successfully and is now ready for review.
                </p>

                <Message
                    severity="success"
                    text="Redirecting to your dashboard..."
                    className="w-full"
                />
            </div>
        );
    }

    const deadline = stage?.deadline
        ? new Date(stage.deadline)
        : null;

    const validDeadline =
        deadline && !isNaN(deadline.getTime());

    const now = Date.now();

    const daysRemaining = validDeadline
        ? Math.ceil(
            (deadline.getTime() - now) /
            (1000 * 60 * 60 * 24)
        )
        : null;

    const isExpired =
        validDeadline &&
        deadline.getTime() < now;

    const isUrgent =
        !isExpired &&
        daysRemaining !== null &&
        daysRemaining <= 3;

    return (
        <div className="max-w-4xl mx-auto mt-5 mb-6 px-3">

            {/* HEADER */}
            <div className="mb-4">
                <div className="flex align-items-center gap-3 mb-2">
                    <div
                        className="flex align-items-center justify-content-center bg-primary-50 text-primary border-round-lg"
                        style={{
                            width: '3rem',
                            height: '3rem'
                        }}
                    >
                        <i className="pi pi-send text-xl" />
                    </div>

                    <div>
                        <h2 className="text-900 m-0">
                            Submit Stage
                        </h2>

                        <p className="text-500 m-0 mt-1">
                            Submit your project for this stage.
                        </p>
                    </div>
                </div>
            </div>

            {/* ERROR */}
            {error && (
                <Message
                    severity="error"
                    text={error}
                    className="w-full mb-4"
                />
            )}

            {/* STAGE INFORMATION */}
            {stage && (
                <div className="surface-card border-1 surface-border border-round-xl shadow-1 p-4 mb-4">

                    <div className="flex align-items-center gap-2 mb-4">
                        <i className="pi pi-info-circle text-primary" />

                        <span className="font-semibold text-900">
                            Stage Information
                        </span>
                    </div>

                    <div className="grid">

                        {/* STAGE */}
                        <div className="col-12 md:col-5">
                            <div className="flex align-items-start gap-3">
                                <i className="pi pi-list-check text-primary mt-1" />

                                <div>
                                    <span className="text-500 text-xs uppercase font-semibold block mb-1">
                                        Stage
                                    </span>

                                    <span className="text-900 font-semibold">
                                        {stage.name || 'Stage'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ORDER */}
                        <div className="col-12 md:col-2">
                            <div className="flex align-items-start gap-3">
                                <i className="pi pi-sort-numeric-down text-primary mt-1" />

                                <div>
                                    <span className="text-500 text-xs uppercase font-semibold block mb-1">
                                        Order
                                    </span>

                                    <span className="text-900 font-medium">
                                        {stage.order}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* DEADLINE */}
                        <div className="col-12 md:col-5">
                            <div className="flex align-items-start gap-3">
                                <i
                                    className={`pi pi-calendar mt-1 ${isExpired
                                        ? 'text-red-500'
                                        : isUrgent
                                            ? 'text-orange-500'
                                            : 'text-primary'
                                        }`}
                                />

                                <div>
                                    <span className="text-500 text-xs uppercase font-semibold block mb-1">
                                        Deadline
                                    </span>

                                    {validDeadline ? (
                                        <>
                                            <span className="text-900 font-semibold block">
                                                {format(
                                                    deadline!,
                                                    'MMM dd, yyyy'
                                                )}
                                            </span>

                                            {isExpired ? (
                                                <Tag
                                                    value="Expired"
                                                    severity="danger"
                                                    rounded
                                                    className="mt-1"
                                                />
                                            ) : isUrgent ? (
                                                <Tag
                                                    value={
                                                        daysRemaining === 0
                                                            ? 'Due today'
                                                            : `${daysRemaining} day${daysRemaining ===
                                                                1
                                                                ? ''
                                                                : 's'
                                                            } left`
                                                    }
                                                    severity="warning"
                                                    rounded
                                                    className="mt-1"
                                                />
                                            ) : null}
                                        </>
                                    ) : (
                                        <span className="text-500">
                                            No deadline specified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* REVIEWERS */}
                        {(stage.minReviewers !== undefined ||
                            stage.maxReviewers !== undefined) && (
                                <div className="col-12 md:col-4">
                                    <div className="flex align-items-start gap-3">
                                        <i className="pi pi-users text-primary mt-1" />

                                        <div>
                                            <span className="text-500 text-xs uppercase font-semibold block mb-1">
                                                Reviewers
                                            </span>

                                            <span className="text-900 font-medium">
                                                {stage.minReviewers ??
                                                    '-'}
                                                {' – '}
                                                {stage.maxReviewers ??
                                                    '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* MIN SCORE */}
                        {stage.minAcceptanceScore !==
                            undefined && (
                                <div className="col-12 md:col-4">
                                    <div className="flex align-items-start gap-3">
                                        <i className="pi pi-chart-line text-primary mt-1" />

                                        <div>
                                            <span className="text-500 text-xs uppercase font-semibold block mb-1">
                                                Minimum Score
                                            </span>

                                            <span className="text-900 font-medium">
                                                {
                                                    stage.minAcceptanceScore
                                                }
                                                %
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                    </div>
                </div>
            )}

            {/* PROJECT */}
            <div className="surface-card border-1 surface-border border-round-xl shadow-1 p-4 mb-4">

                <div className="flex align-items-center gap-2 mb-3">
                    <i className="pi pi-folder-open text-primary" />

                    <div>
                        <div className="font-semibold text-900">
                            Project
                        </div>

                        <div className="text-500 text-sm">
                            Select the project you want to submit.
                        </div>
                    </div>
                </div>

                {projects.length > 0 ? (
                    <Dropdown
                        value={selectedProject}
                        options={projects}
                        onChange={(event) =>
                            setSelectedProject(event.value)
                        }
                        optionLabel="title"
                        placeholder="Select a project"
                        className="w-full"
                        disabled={submitting}
                        filter={projects.length > 5}
                    />
                ) : (
                    <Message
                        severity="warn"
                        text="No eligible projects were found for this stage."
                        className="w-full"
                    />
                )}
            </div>

            {/* DOCUMENT */}
            <div className="surface-card border-1 surface-border border-round-xl shadow-1 p-4 mb-4">

                <div className="flex align-items-center gap-2 mb-3">
                    <i className="pi pi-file-pdf text-red-500" />

                    <div>
                        <div className="font-semibold text-900">
                            Submission Document
                        </div>

                        <div className="text-500 text-sm">
                            Upload your stage document as a PDF.
                        </div>
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
                    chooseLabel={
                        selectedFile
                            ? 'Change PDF'
                            : 'Choose PDF'
                    }
                    uploadOptions={{
                        style: {
                            display: 'none'
                        }
                    }}
                    disabled={submitting}
                    emptyTemplate={
                        <div className="flex flex-column align-items-center justify-content-center py-5">
                            <div
                                className="flex align-items-center justify-content-center bg-red-50 text-red-500 border-circle mb-3"
                                style={{
                                    width: '4rem',
                                    height: '4rem'
                                }}
                            >
                                <i className="pi pi-file-pdf text-2xl" />
                            </div>

                            <span className="font-medium text-700 mb-1">
                                Drop your PDF here
                            </span>

                            <span className="text-500 text-sm">
                                or choose a file from your computer
                            </span>

                            <span className="text-400 text-xs mt-2">
                                PDF only · Maximum 10 MB
                            </span>
                        </div>
                    }
                />
            </div>

            {/* SUMMARY */}
            <div className="surface-50 border-1 surface-border border-round-xl p-4 mb-4">

                <div className="flex align-items-center gap-2 mb-3">
                    <i className="pi pi-list-check text-primary" />

                    <span className="font-semibold text-900">
                        Submission Summary
                    </span>
                </div>

                <div className="flex flex-column gap-3">

                    {/* PROJECT */}
                    <div className="flex align-items-center justify-content-between">
                        <span className="text-600">
                            Project
                        </span>

                        <span className="text-900 font-medium text-right ml-3">
                            {selectedProject?.title ||
                                'Not selected'}
                        </span>
                    </div>

                    {/* STAGE */}
                    <div className="flex align-items-center justify-content-between">
                        <span className="text-600">
                            Stage
                        </span>

                        <span className="text-900 font-medium text-right ml-3">
                            {stage?.name || 'Not selected'}
                        </span>
                    </div>

                    {/* FILE */}
                    <div className="flex align-items-center justify-content-between">
                        <span className="text-600">
                            Document
                        </span>

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
                    label={
                        submitting
                            ? 'Submitting...'
                            : 'Submit Stage'
                    }
                    icon={
                        submitting
                            ? 'pi pi-spin pi-spinner'
                            : 'pi pi-send'
                    }
                    iconPos="right"
                    onClick={handleSubmit}
                    disabled={
                        !selectedProject ||
                        !selectedFile ||
                        submitting ||
                        !!isExpired
                    }
                    className="px-4"
                />

            </div>
        </div>
    );
}