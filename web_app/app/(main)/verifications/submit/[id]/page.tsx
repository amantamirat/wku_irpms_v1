'use client';

import { ProjectApi } from '@/app/(main)/projects/api/project.api';
import {
    Project,
    ProjectStatus
} from '@/app/(main)/projects/models/project.model';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import {
    FileUpload,
    FileUploadSelectEvent
} from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import { VerificationApi } from '../../api/verification.api';
import { VerificationConfigurationApi } from '../../verification-conf/api/verification-conf.api';
import {
    VerificationConfiguration
} from '../../verification-conf/models/verification-conf.model';
import { VerificationStatus } from '../../models/verification.model';
import { Tag } from 'primereact/tag';

interface SectionValidationResult {
    name: string;
    found: boolean;
    passed: boolean;
    wordCount: number;
    issues: string[];
}

interface TemplateValidationResult {
    valid: boolean;
    score: number;
    pages: number;
    issues: string[];
    sections: SectionValidationResult[];
}

export default function VerificationSubmitPage() {
    const params = useParams();
    const router = useRouter();

    const configId = params?.id as string;

    const [config, setConfig] =
        useState<VerificationConfiguration | null>(null);

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] =
        useState<Project | null>(null);

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [initialLoading, setInitialLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [validationDetails, setValidationDetails] =
        useState<TemplateValidationResult | null>(null);

    useEffect(() => {
        if (!configId) return;

        const loadData = async () => {
            try {
                const configuration =
                    await VerificationConfigurationApi.getById!(
                        configId
                    );

                setConfig(configuration);

                const grantId =
                    typeof configuration.grant === 'object'
                        ? configuration.grant?._id
                        : configuration.grant;

                if (!grantId) {
                    setProjects([]);
                    return;
                }

                const userProjects = await ProjectApi.me({
                    grant: grantId,
                    status: ProjectStatus.completed
                });

                const eligibleProjects = await Promise.all(
                    userProjects.map(async (project) => {
                        if (!project.currentVerification) {
                            return project;
                        }

                        const verification =
                            typeof project.currentVerification === 'object'
                                ? project.currentVerification
                                : await VerificationApi.getById!(
                                    project.currentVerification
                                );

                        if (
                            verification?.status ===
                            VerificationStatus.submitted ||
                            verification?.status ===
                            VerificationStatus.verified
                        ) {
                            return null;
                        }

                        return project;
                    })
                );

                const filteredProjects = eligibleProjects.filter(
                    (project): project is Project => project !== null
                );

                setProjects(filteredProjects);

                if (filteredProjects.length === 1) {
                    setSelectedProject(filteredProjects[0]);
                }
            } catch (err: any) {
                console.error(
                    'Failed to load verification submission data',
                    err
                );

                setError(
                    err?.message ||
                    'Failed to load verification details.'
                );
            } finally {
                setInitialLoading(false);
            }
        };

        loadData();
    }, [configId]);

    const clearErrors = () => {
        setError(null);
        setValidationDetails(null);
    };

    const handleFileSelect = (event: FileUploadSelectEvent) => {
        setSelectedFile(event.files[0] ?? null);
        clearErrors();
    };

    const handleFileRemove = () => {
        setSelectedFile(null);
        clearErrors();
    };

    const handleSubmit = async () => {
        if (!selectedProject || !selectedFile || !configId) {
            return;
        }

        setSubmitting(true);
        clearErrors();

        try {
            await VerificationApi.create({
                project: selectedProject._id,
                configuration: configId,
                file: selectedFile
            });

            setSuccess(true);

            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err: any) {
            console.error('Verification submission failed', err);

            if (err?.details?.sections) {
                setValidationDetails(
                    err.details as TemplateValidationResult
                );

                setError(
                    'Your document could not be accepted. Please review the issues below.'
                );
            } else {
                setError(
                    err?.message ||
                    'Submission failed. Please try again.'
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (initialLoading) {
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
                        <Skeleton width="20rem" height="1rem" />
                    </div>
                </div>

                <Skeleton
                    width="100%"
                    height="6rem"
                    className="mb-4"
                />

                <Skeleton
                    width="100%"
                    height="8rem"
                    className="mb-4"
                />

                <Skeleton width="100%" height="10rem" />
            </div>
        );
    }

    const grant =
        config && typeof config.grant === 'object'
            ? config.grant
            : null;

    const grantTitle = grant?.title || 'Grant';

    const organization =
        typeof grant?.organization === 'object'
            ? grant.organization?.name
            : null;

    const deadline =
        config?.deadline
            ? new Date(config.deadline)
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
                    Verification Submitted
                </h2>

                <p className="text-600 line-height-3 mb-4">
                    Your verification document has been submitted
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

    return (
        <div className="max-w-4xl mx-auto mt-5 mb-6 px-3">
            {/* PAGE HEADER */}
            <div className="mb-4">
                <div className="flex align-items-center gap-3 mb-2">
                    <div
                        className="flex align-items-center justify-content-center bg-primary-50 text-primary border-round-lg"
                        style={{
                            width: '3rem',
                            height: '3rem'
                        }}
                    >
                        <i className="pi pi-check-square text-xl" />
                    </div>

                    <div>
                        <h2 className="text-900 m-0">
                            Submit Verification
                        </h2>

                        <p className="text-500 m-0 mt-1">
                            Submit your completed project for verification.
                        </p>
                    </div>
                </div>
            </div>

            {/* VERIFICATION INFORMATION */}
            {config && (
                <div className="surface-card border-1 surface-border border-round-xl shadow-1 p-4 mb-4">
                    <div className="flex align-items-center gap-2 mb-3">
                        <i className="pi pi-info-circle text-primary" />
                        <span className="font-semibold text-900">
                            Verification Information
                        </span>
                    </div>

                    <div className="grid">
                        {/* GRANT */}
                        <div className="col-12 md:col-5">
                            <div className="flex align-items-start gap-3">
                                <i className="pi pi-briefcase text-primary mt-1" />

                                <div>
                                    <span className="text-500 text-xs uppercase font-semibold block mb-1">
                                        Grant
                                    </span>

                                    <span className="text-900 font-semibold">
                                        {grantTitle}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ORGANIZATION */}
                        {organization && (
                            <div className="col-12 md:col-4">
                                <div className="flex align-items-start gap-3">
                                    <i className="pi pi-building text-primary mt-1" />

                                    <div>
                                        <span className="text-500 text-xs uppercase font-semibold block mb-1">
                                            Organization
                                        </span>

                                        <span className="text-900 font-medium">
                                            {organization}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DEADLINE */}
                        <div className="col-12 md:col-3">
                            <div className="flex align-items-start gap-3">
                                <i
                                    className={`pi pi-calendar mt-1 ${isUrgent
                                            ? 'text-orange-500'
                                            : isExpired
                                                ? 'text-red-500'
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
                    </div>
                </div>
            )}

            {/* ERRORS */}
            {error && !validationDetails && (
                <Message
                    severity="error"
                    text={error}
                    className="w-full mb-4"
                />
            )}

            {/* DOCUMENT VALIDATION */}
            {validationDetails && (
                <div className="surface-card border-1 border-red-200 border-round-xl shadow-1 p-4 mb-4">
                    <div className="flex align-items-center gap-2 text-red-700 mb-3">
                        <i className="pi pi-exclamation-triangle text-xl" />

                        <span className="font-semibold">
                            Document Validation Failed
                        </span>
                    </div>

                    <div className="flex align-items-center gap-2 mb-3">
                        <span className="text-600 text-sm">
                            Validation score
                        </span>

                        <Tag
                            value={`${validationDetails.score}%`}
                            severity={
                                validationDetails.valid
                                    ? 'success'
                                    : 'danger'
                            }
                            rounded
                        />
                    </div>

                    {validationDetails.issues?.length > 0 && (
                        <div className="bg-red-50 border-1 border-red-100 border-round-lg p-3 mb-3">
                            <span className="font-semibold text-red-800 text-sm block mb-2">
                                Issues to address
                            </span>

                            <ul className="m-0 pl-4 text-red-700 text-sm line-height-3">
                                {validationDetails.issues.map(
                                    (issue, index) => (
                                        <li key={index}>
                                            {issue}
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    )}

                    <div className="flex flex-column gap-2">
                        {validationDetails.sections.map(
                            (section, index) => (
                                <div
                                    key={index}
                                    className="flex align-items-center justify-content-between surface-50 border-1 surface-border border-round-lg p-3"
                                >
                                    <div className="flex align-items-center gap-2">
                                        <i
                                            className={`pi ${section.passed
                                                    ? 'pi-check-circle text-green-500'
                                                    : 'pi-times-circle text-red-500'
                                                }`}
                                        />

                                        <span className="text-900 text-sm font-medium">
                                            {section.name}
                                        </span>
                                    </div>

                                    <span className="text-500 text-xs">
                                        {section.wordCount} words
                                    </span>
                                </div>
                            )
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
                            Select the completed project you want to verify.
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
                        placeholder="Select a completed project"
                        className="w-full"
                        disabled={submitting}
                        filter={projects.length > 5}
                    />
                ) : (
                    <Message
                        severity="warn"
                        text="No eligible completed projects were found for this verification."
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
                            Verification Document
                        </div>

                        <div className="text-500 text-sm">
                            Upload your verification report as a PDF.
                        </div>
                    </div>
                </div>

                <FileUpload
                    mode="advanced"
                    name="verificationFile"
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
                        style: { display: 'none' }
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
                    <div className="flex align-items-center justify-content-between">
                        <span className="text-600">
                            Project
                        </span>

                        <span className="text-900 font-medium text-right ml-3">
                            {selectedProject?.title ||
                                'Not selected'}
                        </span>
                    </div>

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
                            : 'Submit Verification'
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

