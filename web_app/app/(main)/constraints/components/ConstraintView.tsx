'use client';
import React from 'react';
import { Divider } from 'primereact/divider';
import { Constraint } from '../models/constraint.model';


interface ConstraintViewProps {
    constraint: Constraint;
    title?: string;
}

// Configuration helper for mapping fields to labels, icons, and units
interface RuleConfig {
    label: string;
    icon: string;
    min?: number;
    max?: number;
    unit?: string;
}

export const ConstraintView: React.FC<ConstraintViewProps> = ({
    constraint,
    title = "Constraint Details"
}) => {
    // Helper function to format range displays
    const formatRange = (min?: number, max?: number, unit: string = ''): string => {
        const u = unit ? ` ${unit}` : '';
        if (min !== undefined && max !== undefined) {
            return min === max ? `${min}${u}` : `${min} - ${max}${u}`;
        }
        if (min !== undefined) return `Min: ${min}${u}`;
        if (max !== undefined) return `Max: ${max}${u}`;
        return 'No limit set';
    };

    // Extract all rule categories dynamically
    const rules: RuleConfig[] = [
        { label: 'Participants', icon: 'pi pi-users', min: constraint.minParticipants, max: constraint.maxParticipants },
        { label: 'Phases', icon: 'pi pi-list-check', min: constraint.minPhases, max: constraint.maxPhases },
        { label: 'Budget', icon: 'pi pi-dollar', min: constraint.minBudget, max: constraint.maxBudget, unit: 'Birr' },
        { label: 'Duration', icon: 'pi pi-clock', min: constraint.minDuration, max: constraint.maxDuration, unit: 'days' },
        { label: 'Budget Per Phase', icon: 'pi pi-wallet', min: constraint.minBudgetPerPhase, max: constraint.maxBudgetPerPhase, unit: 'Birr' },
        { label: 'Duration Per Phase', icon: 'pi pi-hourglass', min: constraint.minDurationPerPhase, max: constraint.maxDurationPerPhase, unit: 'days' },
        { label: 'Themes', icon: 'pi pi-bookmark', min: constraint.minThemes, max: constraint.maxThemes },
        { label: 'Sub-Themes', icon: 'pi pi-tags', min: constraint.minSubThemes, max: constraint.maxSubThemes },
        { label: 'Focus Areas', icon: 'pi pi-compass', min: constraint.minFocusAreas, max: constraint.maxFocusAreas },
        { label: 'Indicators', icon: 'pi pi-chart-line', min: constraint.minIndicators, max: constraint.maxIndicators }
    ].filter(r => r.min !== undefined || r.max !== undefined);

    return (
        <div className="constraint-view p-3 surface-card border-round shadow-1">
            {/* Header / Name */}
            <h4 className="mt-0 mb-1 text-primary flex align-items-center">
                <i className="pi pi-sliders-h mr-2"></i>
                {constraint.name || title}
            </h4>

            {/* Description */}
            <p className="text-sm line-height-3 text-600 mb-3">
                {constraint.description || "No specific description provided for this constraint set."}
            </p>

            <Divider align="left">
                <span className="p-tag p-tag-info text-xs uppercase">Configured Rules</span>
            </Divider>

            {/* Grid display of active rules */}
            {rules.length > 0 ? (
                <div className="grid">
                    {rules.map((rule, idx) => (
                        <div key={idx} className="col-12 md:col-6 p-2">
                            <div className="flex align-items-center p-2 border-round surface-50 border-1 border-200 h-full">
                                <i className={`${rule.icon} mr-3 text-primary text-xl`} />
                                <div className="flex flex-column">
                                    <span className="text-500 font-bold uppercase" style={{ fontSize: '10px' }}>
                                        {rule.label}
                                    </span>
                                    <span className="text-900 text-sm font-semibold">
                                        {formatRange(rule.min, rule.max, rule.unit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-3 bg-blue-50 text-blue-700 border-round text-xs italic">
                    No active limits or parameters defined for this constraint model.
                </div>
            )}
        </div>
    );
};