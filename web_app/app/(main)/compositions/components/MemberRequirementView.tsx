'use client';
import React from 'react';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { IRange } from '../models/composition.model';
import { EligibilityProfileView } from './EligibilityProfileView';
import { HistoryRule } from '../models/history.model';
import { MemberRequirement, AggregationMode } from '../models/requirement.model';

interface MemberRequirementViewProps {
    requirement: MemberRequirement;
    title?: string;
}

export const MemberRequirementView: React.FC<MemberRequirementViewProps> = ({
    requirement,
    title = "Member Requirement Details"
}) => {
    // Helper to format threshold range based on ratio vs count mode
    const formatRange = (range?: IRange, isRatio: boolean = false): string => {
        if (!range) return 'No limit set';
        const { min, max } = range;
        const u = isRatio ? '%' : '';

        if (min !== undefined && max !== undefined) {
            return min === max ? `${min}${u}` : `${min}${u} - ${max}${u}`;
        }
        if (min !== undefined) return `Min: ${min}${u}`;
        if (max !== undefined) return `Max: ${max}${u}`;
        return 'No limit set';
    };

    // Helper to resolve linked history rule display text
    const getHistoryRuleName = (rule?: string | HistoryRule): string => {
        if (!rule) return 'None linked';
        return typeof rule === 'object' ? rule.name : `History Rule ID: ${rule}`;
    };

    const isRatioMode = requirement.mode === AggregationMode.RATIO;

    return (
        <div className="member-requirement-view p-3 surface-card border-round shadow-1">
            {/* Header / Name */}
            <div className="flex align-items-center justify-content-between mb-2">
                <h4 className="mt-0 mb-0 text-primary flex align-items-center">
                    <i className="pi pi-users mr-2 text-xl"></i>
                    {requirement.name || title}
                </h4>
                <Tag 
                    value={requirement.mode || AggregationMode.COUNT} 
                    severity={isRatioMode ? 'purple' as any : 'info'} 
                    icon={isRatioMode ? 'pi pi-percentage' : 'pi pi-hashtag'}
                    className="text-xs uppercase"
                />
            </div>

            {/* Description */}
            <p className="text-sm line-height-3 text-600 mb-3">
                {requirement.description || "No specific description provided for this member requirement."}
            </p>

            <Divider align="left">
                <span className="p-tag p-tag-info text-xs uppercase">Threshold & Context</span>
            </Divider>

            {/* Core Requirement Metrics */}
            <div className="grid">
                {/* Aggregation & Threshold Card */}
                <div className="col-12 md:col-6 p-2">
                    <div className="flex align-items-center p-2 border-round surface-50 border-1 border-200 h-full">
                        <i className={`${isRatioMode ? 'pi pi-percentage' : 'pi pi-hashtag'} mr-3 text-primary text-xl`} />
                        <div className="flex flex-column">
                            <span className="text-500 font-bold uppercase" style={{ fontSize: '10px' }}>
                                Required {isRatioMode ? 'Percentage Ratio' : 'Member Count'}
                            </span>
                            <span className="text-900 text-sm font-semibold">
                                {formatRange(requirement.threshold, isRatioMode)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Linked History Rule Card */}
                {requirement.historyRule && (
                    <div className="col-12 md:col-6 p-2">
                        <div className="flex align-items-center p-2 border-round surface-50 border-1 border-200 h-full">
                            <i className="pi pi-history mr-3 text-primary text-xl" />
                            <div className="flex flex-column">
                                <span className="text-500 font-bold uppercase" style={{ fontSize: '10px' }}>
                                    Target History Rule
                                </span>
                                <span className="text-900 text-sm font-semibold">
                                    {getHistoryRuleName(requirement.historyRule)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Embedded Eligibility Profile Component */}
            {requirement.profile && (
                <div className="mt-3">
                    <Divider align="left">
                        <span className="p-tag p-tag-info text-xs uppercase">Associated Eligibility Profile</span>
                    </Divider>
                    <EligibilityProfileView profile={requirement.profile} />
                </div>
            )}

            {/* Guidance Note */}
            <div className="mt-4 p-3 bg-blue-50 border-left-3 border-blue-500 border-round-right">
                <p className="m-0 text-xs text-blue-900 line-height-2">
                    <strong>Note:</strong> Teams submitting for this call must satisfy this {isRatioMode ? 'ratio threshold' : 'member count threshold'} across participating members.
                </p>
            </div>
        </div>
    );
};