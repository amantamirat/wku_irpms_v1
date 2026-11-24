'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { InputTextarea } from 'primereact/inputtextarea';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { Project } from '@/app/(main)/projects/models/project.model';
import { extractId } from '@/utils/utils';

import {
    ProjectDocument,
    PhaseDocumentType,
    PhaseDocumentTypeLabels,
    DocumentScope,
    DOCUMENT_TYPE_SCOPE
} from '../model/phase.doc';
import { PhaseApi } from '../../api/phase.api';
import { Phase } from '../../models/phase.model';
import { Activity } from '../../../activities/models/phase-activity.model';
import { ActivityApi } from '../../../activities/api/phase-activity.api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface PhaseDocumentFormProps
    extends ItemFormRenderProps<ProjectDocument> {
    project?: Project | string | null;
    phase?: Phase | string | null;
    activity?: Activity | string | null;
}

export const optionTemplate = (option: { label: string; description?: string }) => {
    if (!option) return null;
    return (
        <div className="flex flex-column" style={{ maxWidth: '400px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
            <span className="font-bold text-900">{option.label}</span>
            {option.description && (
                <span className="text-xs text-500 line-height-2 mt-1">{option.description}</span>
            )}
        </div>
    );
};

const PhaseDocumentForm = ({
    item,
    saving,
    formId,
    onSubmit,
    project,
    phase,
    activity
}: PhaseDocumentFormProps) => {
    const buildInitialItem = () =>
        ({
            ...(item ?? {}),
            project: project ?? item?.project ?? undefined,
            phase: phase ?? item?.phase ?? undefined,
            activity: activity ?? item?.activity ?? undefined,
            description: item?.description ?? '',
            file: undefined
        }) as ProjectDocument;

    const [localItem, setLocalItem] = useState<ProjectDocument>(buildInitialItem);
    const [submitted, setSubmitted] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    const [phases, setPhases] = useState<Phase[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);

    const projectId = extractId(localItem.project);
    const phaseId = extractId(localItem.phase);
    const activityId = extractId(localItem.activity);

    const phaseLocked = phase != null;
    const activityLocked = activity != null;

    // Scope of the selected type (undefined until a type is chosen)
    const scope = localItem.type ? DOCUMENT_TYPE_SCOPE[localItem.type] : undefined;

    // project  -> no phase, no activity
    // phase    -> phase (required)
    // activity -> activity (required); phase shown as an optional filter
    const showPhase = scope === DocumentScope.phase || scope === DocumentScope.activity;
    const showActivity = scope === DocumentScope.activity;

    const phaseRequired = scope === DocumentScope.phase;
    const activityRequired = scope === DocumentScope.activity;

    useEffect(() => {
        setLocalItem(buildInitialItem());
        setSubmitted(false);
        setFileError(null);
    }, [item, project, phase, activity]);

    // Load Phases
    useEffect(() => {
        if (!projectId || !showPhase) {
            setPhases([]);
            return;
        }
        PhaseApi.lookup!({ project: projectId })
            .then((res) => setPhases(res as Phase[]))
            .catch(() => setPhases([]));
    }, [projectId, showPhase]);

    // Load Activities
    useEffect(() => {
        if (!projectId || !showActivity) {
            setActivities([]);
            return;
        }
        ActivityApi.lookup!({ project: projectId, ...(phaseId ? { phase: phaseId } : {}) })
            .then((res) => setActivities(res as Activity[]))
            .catch(() => setActivities([]));
    }, [projectId, phaseId, showActivity]);

    const typeOptions = Object.values(PhaseDocumentType).map((typeKey) => ({
        label: PhaseDocumentTypeLabels[typeKey].label,
        value: typeKey,
        description: PhaseDocumentTypeLabels[typeKey].description
    }));

    const projectMissing = !projectId;
    const typeMissing = !localItem.type;
    const descriptionMissing = !localItem.description?.trim();
    const fileMissing = !localItem._id && !localItem.file && !localItem.documentPath;
    const phaseMissing = phaseRequired && !phaseId;
    const activityMissing = activityRequired && !activityId;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);

        if (
            saving ||
            projectMissing ||
            typeMissing ||
            descriptionMissing ||
            fileMissing ||
            phaseMissing ||
            activityMissing ||
            fileError
        ) {
            return;
        }

        await onSubmit({
            ...localItem,
            project: projectId,
            phase: showPhase ? phaseId || undefined : undefined,
            activity: showActivity ? activityId || undefined : undefined
        } as ProjectDocument);
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            <div className="grid">
                {/* Project */}
                <div className="field col-12">
                    <label className="font-bold text-sm block mb-2">
                        Project <span className="text-red-500">*</span>
                    </label>
                    <div className={classNames('p-inputtext p-component flex align-items-center surface-100 text-color-secondary', { 'p-invalid': submitted && projectMissing })}>
                        {typeof localItem.project === 'object' && localItem.project
                            ? localItem.project.title
                            : projectId ? `Project ID: ${projectId}` : 'No project selected'}
                    </div>
                </div>

                {/* Document Type */}
                <div className="field col-12">
                    <label htmlFor="type" className="font-bold text-sm block mb-2">
                        Document Type <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        id="type"
                        value={localItem.type ?? null}
                        options={typeOptions}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => {
                            const newType = e.value as PhaseDocumentType;
                            const newScope = newType ? DOCUMENT_TYPE_SCOPE[newType] : undefined;

                            setLocalItem((prev) => ({
                                ...prev,
                                type: newType,
                                // Restore locked props when the new scope needs them,
                                // otherwise clear values that no longer apply
                                phase:
                                    newScope === DocumentScope.phase || newScope === DocumentScope.activity
                                        ? (phase ?? prev.phase)
                                        : undefined,
                                activity:
                                    newScope === DocumentScope.activity
                                        ? (activity ?? prev.activity)
                                        : undefined
                            }));
                        }}
                        placeholder="Select a document type"
                        itemTemplate={optionTemplate}
                        valueTemplate={(option) =>
                            option ? PhaseDocumentTypeLabels[option.value as PhaseDocumentType]?.label ?? option.label : 'Select a document type'
                        }
                        filter
                        disabled={saving}
                        className={classNames({ 'p-invalid': submitted && typeMissing })}
                    />
                    {submitted && typeMissing && <small className="p-error block mt-1">Document type is required.</small>}
                </div>

                {/* Phase (phase and activity scopes) */}
                {showPhase && (
                    <div className="field col-12 md:col-6">
                        <label htmlFor="phase" className="font-bold text-sm block mb-2">
                            Phase {phaseRequired && <span className="text-red-500">*</span>}
                        </label>
                        {phaseLocked ? (
                            <div className="p-inputtext p-component flex align-items-center surface-100 text-color-secondary">
                                {typeof phase === 'object' && phase ? `Phase ${phase.order}` : `Phase ID: ${phaseId}`}
                            </div>
                        ) : (
                            <Dropdown
                                id="phase"
                                value={phaseId ?? null}
                                options={phases.map((p) => ({ label: `Phase ${p.order}`, value: p._id }))}
                                optionLabel="label"
                                optionValue="value"
                                onChange={(e) =>
                                    setLocalItem((prev) => ({
                                        ...prev,
                                        phase: phases.find((p) => p._id === e.value),
                                        activity: undefined
                                    }))
                                }
                                placeholder="Select phase"
                                showClear={!phaseRequired}
                                filter
                                disabled={saving}
                                className={classNames({ 'p-invalid': submitted && phaseMissing })}
                            />
                        )}
                        {submitted && phaseMissing && <small className="p-error block mt-1">Phase is required for this document type.</small>}
                        {scope === DocumentScope.activity && !phaseLocked && (
                            <small className="block mt-1 text-500">Optional: filters the activity list.</small>
                        )}
                    </div>
                )}

                {/* Activity (activity scope only) */}
                {showActivity && (
                    <div className="field col-12 md:col-6">
                        <label htmlFor="activity" className="font-bold text-sm block mb-2">
                            Activity <span className="text-red-500">*</span>
                        </label>
                        {activityLocked ? (
                            <div className="p-inputtext p-component flex align-items-center surface-100 text-color-secondary">
                                {typeof activity === 'object' && activity ? activity.title : `Activity ID: ${activityId}`}
                            </div>
                        ) : (
                            <Dropdown
                                id="activity"
                                value={activityId ?? null}
                                options={activities.map((a) => ({ label: a.title, value: a._id }))}
                                optionLabel="label"
                                optionValue="value"
                                onChange={(e) =>
                                    setLocalItem((prev) => ({
                                        ...prev,
                                        activity: activities.find((a) => a._id === e.value)
                                    }))
                                }
                                placeholder="Select activity"
                                filter
                                disabled={saving}
                                className={classNames({ 'p-invalid': submitted && activityMissing })}
                            />
                        )}
                        {submitted && activityMissing && <small className="p-error block mt-1">Activity is required for this document type.</small>}
                    </div>
                )}

                {/* Description */}
                <div className="field col-12">
                    <label htmlFor="description" className="font-bold text-sm block mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <InputTextarea
                        id="description"
                        rows={3}
                        autoResize
                        value={localItem.description ?? ''}
                        onChange={(e) => setLocalItem((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the document..."
                        disabled={saving}
                        className={classNames({ 'p-invalid': submitted && descriptionMissing })}
                    />
                    {submitted && descriptionMissing && <small className="p-error block mt-1">Description is required.</small>}
                </div>

                {/* File Upload */}
                <div className="field col-12">
                    <label className="font-bold text-sm block mb-2">
                        Upload Document {fileMissing && <span className="text-red-500"> *</span>}
                    </label>
                    <FileUpload
                        key={`${localItem._id ?? 'new'}-${localItem.documentPath ?? ''}`}
                        name="file"
                        mode="advanced"
                        auto={false}
                        customUpload
                        chooseLabel="Select File"
                        cancelLabel="Clear"
                        maxFileSize={MAX_FILE_SIZE}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg"
                        disabled={saving}
                        emptyTemplate={<p className="m-0">Drag and drop a file here to upload</p>}
                        onSelect={(e: FileUploadSelectEvent) => {
                            const file = e.files?.[0];
                            if (!file) return;
                            if (file.size > MAX_FILE_SIZE) {
                                setFileError('Maximum file size is 5 MB.');
                                return;
                            }
                            setFileError(null);
                            setLocalItem((prev) => ({ ...prev, file }));
                        }}
                        onClear={() => {
                            setLocalItem((prev) => ({ ...prev, file: undefined }));
                            setFileError(null);
                        }}
                    />
                    {localItem.file && <small className="block mt-2 text-600">Selected: {localItem.file.name}</small>}
                    {fileError && <small className="p-error block mt-1">{fileError}</small>}
                </div>
            </div>
        </form>
    );
};

export default PhaseDocumentForm;