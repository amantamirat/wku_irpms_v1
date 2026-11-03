'use client';

import React from 'react';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { EligibilityProfileView } from './EligibilityProfileView';
import { IHistoryRule } from '../models/history.model';
import { IMemberRequirement } from '../models/requirement.model';
import { EligibilityProfile } from '../models/profile.model';

interface MemberRequirementViewProps {
    requirement: IMemberRequirement;
    title?: string;
}

export const MemberRequirementView: React.FC<MemberRequirementViewProps> = ({
    requirement,
    title = "Member Requirement Details"
}) => {
    // Helper to resolve linked history rule display name
    const getHistoryRuleName = (rule?: string | IHistoryRule): string => {
        if (!rule) return 'None linked';
        return typeof rule === 'object' && rule !== null ? rule.name : `History Rule ID: ${rule}`;
    };

    const hasHistoryRules = requirement.historyRules && requirement.historyRules.length > 0;
    const profileObj = typeof requirement.profile === 'object' && requirement.profile !== null
        ? (requirement.profile as EligibilityProfile)
        : undefined;

    return (
        <div className="member-requirement-view p-3 surface-card border-round shadow-1">
            {/* Header / Name */}
            <div className="flex align-items-center justify-content-between mb-2">
                <h4 className="mt-0 mb-0 text-primary flex align-items-center">
                    <i className="pi pi-users mr-2 text-xl"></i>
                    {requirement.name || title}
                </h4>
            </div>

            {/* Description */}
            <p className="text-sm line-height-3 text-600 mb-3">
                {requirement.description || "No specific description provided for this member requirement."}
            </p>

            {/* Linked History Rules List Section */}
            {hasHistoryRules && (
                <div className="mt-3">
                    <div className="text-500 font-bold uppercase mb-2" style={{ fontSize: '10px' }}>
                        Linked History Rules
                    </div>
                    <div className="grid">
                        {requirement.historyRules.map((hr: string | IHistoryRule, index: number) => {
                            const isPopulated = typeof hr === 'object' && hr !== null;
                            const historyRuleObj = isPopulated ? (hr as IHistoryRule) : null;

                            return (
                                <div key={index} className="col-12 md:col-6 p-2">
                                    <div className="flex align-items-center justify-content-between p-2 border-round surface-50 border-1 border-200 h-full">
                                        <div className="flex align-items-center">
                                            <i className="pi pi-history mr-3 text-primary text-xl" />
                                            <div className="flex flex-column">
                                                <span className="text-900 text-sm font-semibold">
                                                    {getHistoryRuleName(hr)}
                                                </span>
                                                {historyRuleObj?.context && (
                                                    <span className="text-500 text-xs">
                                                        Context: {historyRuleObj.context}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {historyRuleObj?.participation && (
                                            <Tag value={historyRuleObj.participation} severity="info" className="text-xs" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Embedded Eligibility Profile Component */}
            {profileObj && (
                <div className="mt-3">
                    <Divider align="left">
                        <span className="p-tag p-tag-info text-xs uppercase">Associated Eligibility Profile</span>
                    </Divider>
                    <EligibilityProfileView profile={profileObj} />
                </div>
            )}

            {/* Guidance Note */}
            <div className="mt-4 p-3 bg-blue-50 border-left-3 border-blue-500 border-round-right">
                <p className="m-0 text-xs text-blue-900 line-height-2">
                    <strong>Note:</strong> Team members are evaluated against the selected history rules and demographic profile requirements.
                </p>
            </div>
        </div>
    );
};