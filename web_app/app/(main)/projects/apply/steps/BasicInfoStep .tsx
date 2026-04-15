'use client';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TreeSelect } from 'primereact/treeselect';
import { classNames } from 'primereact/utils';
import { ProgressBar } from 'primereact/progressbar';
import { useEffect, useState, useMemo } from 'react';
import { ThemeApi } from '@/app/(main)/thematics/themes/api/theme.api';
import { Call } from '@/app/(main)/calls/models/call.model';
import { buildTree } from '@/app/(main)/thematics/models/thematic.node';
import { Project } from '../../models/project.model';
import { Constraint, ProjectConstraintType } from '@/app/(main)/grants/constraints/models/constraint.model';
import { Theme } from '@/app/(main)/thematics/themes/models/theme.model';

interface BasicInfoStepProps {
    data: Partial<Project>;
    call: Call;
    constraints: Constraint[];
    onUpdate: (data: Partial<Project>) => void;
    onNext: () => void;
}

export const BasicInfoStep = ({ data, call, constraints, onUpdate, onNext }: BasicInfoStepProps) => {
    const [submitted, setSubmitted] = useState(false);
    const [allThemes, setAllThemes] = useState<Theme[]>([]);
    const [themeNodes, setThemeNodes] = useState([]);

    // Helpers for title and summry
    const getWordCount = (str: string = '') => str.trim().split(/\s+/).filter(Boolean).length;
    const getLimit = (type: ProjectConstraintType) => constraints.find(c => c.constraint === type);

    //a lookup map once the themes are loaded
    const themesMap = useMemo(() => {
        const map: Record<string, Theme> = {};
        allThemes.forEach(t => {
            if (t._id) map[t._id] = t;
        });
        return map;
    }, [allThemes]);


    const themeStats = useMemo(() => {
        const selectedIds = data.themes || [];

        const buckets: Record<number, Set<string>> = {
            0: new Set(), // Themes
            1: new Set(), // Sub-themes
            2: new Set(), // Focus Areas
            3: new Set()  // Indicators
        };

        selectedIds.forEach(id => {
            let currentId: string | undefined = typeof id === 'object' ? (id as any)._id : id;

            while (currentId && themesMap[currentId]) {
                const theme = themesMap[currentId];
                buckets[theme.level || 0].add(currentId);
                // Move up to parent
                currentId = typeof theme.parent === 'object'
                    ? theme.parent?._id
                    : theme.parent;
            }
        });

        return {
            themeCount: buckets[0].size,
            subThemeCount: buckets[1].size,
            focusAreaCount: buckets[2].size,
            indicatorCount: buckets[3].size,
        };
    }, [data.themes, themesMap]);

    // Validation Results
    const validation = useMemo(() => {
        const titleLimit = getLimit(ProjectConstraintType.PROJECT_TITLE);
        const summaryLimit = getLimit(ProjectConstraintType.PROJECT_SUMMARY);

        const themeLimit = getLimit(ProjectConstraintType.THEME);
        const subThemeLimit = getLimit(ProjectConstraintType.SUB_THEME);
        const focusLimit = getLimit(ProjectConstraintType.FOCUS_AREA);
        const indicatorLimit = getLimit(ProjectConstraintType.INDICATOR);

        const titleWords = getWordCount(data.title);
        const summaryWords = getWordCount(data.summary);

        const checkRange = (val: number, limit?: Constraint) => !limit || (val >= (limit.min ?? 0) && val <= (limit.max ?? Infinity));

        const isTitleValid = !!data.title?.trim() && checkRange(titleWords, titleLimit);
        const isSummaryValid = !!data.summary?.trim() && checkRange(summaryWords, summaryLimit);

        const isHierarchyValid =
            checkRange(themeStats.themeCount, themeLimit) &&
            checkRange(themeStats.subThemeCount, subThemeLimit) &&
            checkRange(themeStats.focusAreaCount, focusLimit) &&
            checkRange(themeStats.indicatorCount, indicatorLimit) &&
            data.themes?.length! > 0;

        return {
            isTitleValid, titleWords, titleLimit,
            isSummaryValid, summaryWords, summaryLimit,
            isHierarchyValid, themeStats,
            themeLimit, subThemeLimit, focusLimit, indicatorLimit,
            isValid: isTitleValid && isSummaryValid && isHierarchyValid
        };
    }, [data.title, data.summary, data.themes, themeStats, constraints]);

    const validateAndNext = () => {
        setSubmitted(true);
        if (validation.isValid) {
            setSubmitted(false);
            onNext();
        }
    };

    // UI Progress Calculation
    const getProgressValue = (current: number, max?: number) => {
        if (!max) return 0;
        return Math.min((current / max) * 100, 100);
    };



    useEffect(() => {
        const loadThemes = async () => {
            try {
                const thematicId = (call.grantAllocation as any)?.grant?.thematic;
                if (thematicId) {
                    const tData = await ThemeApi.getAll({ thematicArea: thematicId });
                    setAllThemes(tData);
                    setThemeNodes(buildTree(tData) as any);
                }
            } catch (err) {
                console.error("Error loading themes:", err);
            }
        };
        loadThemes();
    }, [call]);





    const getThemeSelectionKeys = () => {
        const selection: any = {};
        data.themes?.forEach((t: any) => {
            const id = typeof t === 'object' ? t._id : t;
            selection[id] = { checked: true, partialChecked: false };
        });
        return selection;
    };

    const onThemeChange = (e: any) => {
        const selectedIds = Object.keys(e.value).filter(key => e.value[key].checked);
        onUpdate({ ...data, themes: selectedIds as any });
    };

    return (
        <div className="p-fluid grid mt-4">
            {/* Project Title */}
            <div className="field col-12">
                <div className="flex justify-content-between align-items-end mb-1">
                    <label htmlFor="title" className="font-bold">Project Title</label>
                    <small className={classNames('text-500', { 'text-red-500': validation.titleLimit?.max && validation.titleWords > validation.titleLimit.max })}>
                        {validation.titleWords} / {validation.titleLimit?.max || '∞'} words
                    </small>
                </div>
                <InputText
                    id="title"
                    value={data.title || ''}
                    onChange={(e) => onUpdate({ ...data, title: e.target.value })}
                    className={classNames({ 'p-invalid': submitted && !validation.isTitleValid })}
                    placeholder="Enter project title"
                />
                {validation.titleLimit?.max && (
                    <ProgressBar value={getProgressValue(validation.titleWords, validation.titleLimit.max)} showValue={false} style={{ height: '4px' }} />
                )}
                {submitted && !validation.isTitleValid && (
                    <small className="p-error block mt-1">
                        Title must be between {validation.titleLimit?.min || 0} and {validation.titleLimit?.max || '∞'} words.
                    </small>
                )}
            </div>

            {/* Thematic Focus */}
            <div className="field col-12">
                <label className="font-bold">Thematic Focus</label>
                <TreeSelect
                    value={getThemeSelectionKeys()}
                    options={themeNodes}
                    onChange={onThemeChange}
                    display="chip"
                    selectionMode="checkbox"
                    placeholder="Select applicable themes"
                    className={classNames({ 'p-invalid': submitted && !validation.isHierarchyValid })}
                />
                {/* Stats Chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                    {[
                        { label: 'Themes', count: themeStats.themeCount, limit: validation.themeLimit },
                        { label: 'Sub-themes', count: themeStats.subThemeCount, limit: validation.subThemeLimit },
                        { label: 'Focus Areas', count: themeStats.focusAreaCount, limit: validation.focusLimit },
                        { label: 'Indicators', count: themeStats.indicatorCount, limit: validation.indicatorLimit }
                    ].map(s => (
                        s.limit && (
                            <div key={s.label} className={classNames("px-2 py-1 border-round text-xs font-bold border-1",
                                (s.count >= (s.limit.min ?? 0) && s.count <= (s.limit.max ?? Infinity)) ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-red-50 border-red-200 text-red-700")}>
                                {s.label}: {s.count} (Min: {s.limit.min ?? 0})
                            </div>
                        )
                    ))}
                </div>
                {submitted && !validation.isHierarchyValid && <small className="p-error block mt-1">Please satisfy all hierarchical thematic requirements.</small>}
            </div>

            {/* Executive Summary */}
            <div className="field col-12">
                <div className="flex justify-content-between align-items-end mb-1">
                    <label htmlFor="summary" className="font-bold">Executive Summary</label>
                    <small className={classNames('text-500', { 'text-red-500': validation.summaryLimit?.max && validation.summaryWords > validation.summaryLimit.max })}>
                        {validation.summaryWords} / {validation.summaryLimit?.max || '∞'} words
                    </small>
                </div>
                <InputTextarea
                    id="summary"
                    value={data.summary || ''}
                    onChange={(e) => onUpdate({ ...data, summary: e.target.value })}
                    rows={6}
                    className={classNames({ 'p-invalid': submitted && !validation.isSummaryValid })}
                    placeholder="Provide a brief summary of the project..."
                />
                {validation.summaryLimit?.max && (
                    <ProgressBar value={getProgressValue(validation.summaryWords, validation.summaryLimit.max)} showValue={false} style={{ height: '4px' }} />
                )}
                {submitted && !validation.isSummaryValid && (
                    <small className="p-error block mt-1">
                        Summary must be between {validation.summaryLimit?.min || 0} and {validation.summaryLimit?.max || '∞'} words.
                    </small>
                )}
            </div>

            <div className="flex justify-content-end mt-4">
                <Button label="Next: Budget & Phases" icon="pi pi-chevron-right" iconPos="right" onClick={validateAndNext} />
            </div>
        </div>
    );
};