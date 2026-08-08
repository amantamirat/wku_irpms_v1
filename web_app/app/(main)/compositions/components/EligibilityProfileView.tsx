'use client';
import React, { useEffect, useState } from 'react';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { AcademicLevel } from '../../organizations/models/organization.model';
import { Accessibility } from '../../users/models/user.model';
import { IRange } from '../models/composition.model';
import { EligibilityProfile } from '../models/profile.model';
import { ProfileApi } from '../api/profile.api';


interface EligibilityProfileViewProps {
    profile: EligibilityProfile | string;
    title?: string;
}

interface ProfileRuleConfig {
    label: string;
    icon: string;
    value?: React.ReactNode;
}

const formatEnumValue = (val: string | number): string => {
    if (typeof val === 'number') return String(val);
    return val
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const EligibilityProfileView: React.FC<EligibilityProfileViewProps> = ({
    profile: initialProfile,
    title = "Eligibility Profile Details"
}) => {
    const [profileData, setProfileData] = useState<EligibilityProfile | null>(
        typeof initialProfile === 'object' ? initialProfile : null
    );
    const [loading, setLoading] = useState<boolean>(typeof initialProfile === 'string');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If passed as an object, sync state directly
        if (typeof initialProfile === 'object' && initialProfile !== null) {
            setProfileData(initialProfile);
            setLoading(false);
            return;
        }

        // If passed as a string ID, fetch via ProfileApi
        if (typeof initialProfile === 'string' && initialProfile.trim() !== '') {
            setLoading(true);
            setError(null);

            ProfileApi.getById!(initialProfile)
                .then((data: EligibilityProfile) => {
                    setProfileData(data);
                })
                .catch((err: unknown) => {
                    console.error('Error fetching EligibilityProfile:', err);
                    setError('Unable to load eligibility profile details.');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [initialProfile]);

    const formatRange = (range?: IRange, unit: string = ''): string | null => {
        if (!range) return null;
        const { min, max } = range;
        const u = unit ? ` ${unit}` : '';

        if (min !== undefined && max !== undefined) {
            return min === max ? `${min}${u}` : `${min} - ${max}${u}`;
        }
        if (min !== undefined) return `Min: ${min}${u}`;
        if (max !== undefined) return `Max: ${max}${u}`;
        return null;
    };

    // 1. Loading State
    if (loading) {
        return (
            <div className="p-4 surface-card border-round shadow-1 flex align-items-center justify-content-center">
                <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
                <span className="ml-3 text-sm text-600">Loading eligibility profile...</span>
            </div>
        );
    }

    // 2. Error State
    if (error || !profileData) {
        return (
            <div className="p-3 bg-red-50 text-red-700 border-round text-xs border-1 border-red-200">
                <i className="pi pi-exclamation-triangle mr-2"></i>
                {error || `Failed to find profile ID: ${initialProfile}`}
            </div>
        );
    }

    // 3. Render Profile Details
    const rules: ProfileRuleConfig[] = [
        {
            label: 'Gender',
            icon: 'pi pi-user',
            value: profileData.gender ? <span className="capitalize">{formatEnumValue(profileData.gender)}</span> : null
        },
        {
            label: 'Age Limit',
            icon: 'pi pi-calendar',
            value: formatRange(profileData.age, 'years')
        },
        {
            label: 'Experience',
            icon: 'pi pi-briefcase',
            value: formatRange(profileData.experienceYears, 'years')
        },
        {
            label: 'Academic Levels',
            icon: 'pi pi-book',
            value: profileData.academicLevels && profileData.academicLevels.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                    {profileData.academicLevels.map((level: AcademicLevel, idx: number) => (
                        <Tag key={idx} value={formatEnumValue(level)} severity="success" className="text-xs" />
                    ))}
                </div>
            ) : null
        },
        {
            label: 'Accessibility Support',
            icon: 'pi pi-heart',
            value: profileData.accessibility && profileData.accessibility.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                    {profileData.accessibility.map((acc: Accessibility, idx: number) => (
                        <Tag key={idx} value={formatEnumValue(acc)} severity="warning" className="text-xs" />
                    ))}
                </div>
            ) : null
        }
    ].filter(r => r.value !== null && r.value !== undefined);

    return (
        <div className="eligibility-profile-view p-3 surface-card border-round shadow-1">
            <h4 className="mt-0 mb-1 text-primary flex align-items-center">
                <i className="pi pi-id-card mr-2 text-xl"></i>
                {profileData.name || title}
            </h4>

            <p className="text-sm line-height-3 text-600 mb-3">
                {profileData.description || "No specific description provided for this eligibility profile."}
            </p>

            <Divider align="left">
                <span className="text-xs uppercase font-bold text-500 surface-100 px-2 py-1 border-round">
                    Eligibility Criteria
                </span>
            </Divider>

            {rules.length > 0 ? (
                <div className="grid">
                    {rules.map((rule, idx) => (
                        <div key={idx} className="col-12 md:col-6 p-2">
                            <div className="flex align-items-center p-2 border-round surface-50 border-1 border-200 h-full">
                                <i className={`${rule.icon} mr-3 text-primary text-xl`} />
                                <div className="flex flex-column w-full">
                                    <span className="text-500 font-bold uppercase" style={{ fontSize: '10px' }}>
                                        {rule.label}
                                    </span>
                                    <div className="text-900 text-sm font-semibold">
                                        {rule.value}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-3 bg-blue-50 text-blue-700 border-round text-xs italic">
                    No specific eligibility criteria defined for this profile.
                </div>
            )}            
        </div>
    );
};