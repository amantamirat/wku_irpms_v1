'use client';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TreeSelect } from 'primereact/treeselect';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';
import { ThemeApi } from '@/app/(main)/thematics/themes/api/theme.api';
import { Call } from '@/app/(main)/calls/models/call.model';
import { buildTree } from '@/app/(main)/thematics/models/thematic.node';
import { Project } from '../../models/project.model';


interface BasicInfoStepProps {
    data: Partial<Project>;
    call: Call;
    onUpdate: (data: Partial<Project>) => void;
    onNext: () => void;
}

export const BasicInfoStep = ({ data, call, onUpdate, onNext }: BasicInfoStepProps) => {
    const [submitted, setSubmitted] = useState(false);
    const [themeNodes, setThemeNodes] = useState([]);

    useEffect(() => {
        const loadThemes = async () => {
            try {
                const thematicId = (call.grantAllocation as any)?.grant?.thematic;
                if (thematicId) {
                    const tData = await ThemeApi.getAll({ thematicArea: thematicId });
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

    const validateAndNext = () => {
        setSubmitted(true);
        if (data.title && data.themes?.length && data.summary) {
            setSubmitted(false);
            onNext();
        }
    };

    return (
        <div className="p-fluid grid mt-4">
            <div className="field col-12">
                <label htmlFor="title" className="font-bold">Project Title</label>
                <InputText
                    id="title"
                    value={data.title}
                    onChange={(e) => onUpdate({ ...data, title: e.target.value })}
                    placeholder="Enter a clear, descriptive title"
                    className={classNames({ 'p-invalid': submitted && !data.title })}
                />
                {submitted && !data.title && (
                    <small className="p-error">Project title is required</small>
                )}
            </div>

            <div className="field col-12">
                <label className="font-bold">Thematic Focus</label>
                <TreeSelect
                    value={getThemeSelectionKeys()}
                    options={themeNodes}
                    onChange={onThemeChange}
                    display="chip"
                    selectionMode="checkbox"
                    placeholder="Select applicable themes"
                    className={classNames({ 'p-invalid': submitted && (!data.themes || data.themes.length === 0) })}
                    filter
                />
                {submitted && (!data.themes || data.themes.length === 0) && (
                    <small className="p-error">At least one theme is required</small>
                )}
            </div>

            <div className="field col-12">
                <label htmlFor="summary" className="font-bold">Executive Summary</label>
                <InputTextarea
                    id="summary"
                    value={data.summary}
                    onChange={(e) => onUpdate({ ...data, summary: e.target.value })}
                    rows={4}
                    placeholder="Briefly describe the objectives and impact..."
                    className={classNames({ 'p-invalid': submitted && !data.summary })}
                />
                {submitted && !data.summary && (
                    <small className="p-error">Executive summary is required</small>
                )}
            </div>

            <div className="flex justify-content-end mt-4">
                <Button
                    label="Next: Budget & Phases"
                    icon="pi pi-chevron-right"
                    iconPos="right"
                    onClick={validateAndNext}
                />
            </div>
        </div>
    );
};