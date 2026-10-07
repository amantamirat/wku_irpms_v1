'use client';

import React from 'react';
import { Divider } from 'primereact/divider';
import { HistoryRule, HistoryMetric, HistoryParticipation } from '../models/history.model';
import { IRange } from '@/types/range';

interface HistoryRuleViewProps {
    historyRule: HistoryRule;
    title?: string;
}

interface HistoryMetricConfig {
    label: string;
    icon: string;
    range?: IRange;
    badgeSeverity: string;
}

const metricConfigMap: Record<HistoryMetric, { label: string; icon: string; badgeSeverity: string }> = {
    [HistoryMetric.PROJECT_GRANTED]: { label: 'Granted Projects', icon: 'pi pi-check-circle', badgeSeverity: 'text-green-500' },
    [HistoryMetric.PROJECT_REFUSED]: { label: 'Refused Projects', icon: 'pi pi-ban', badgeSeverity: 'text-red-500' },
    [HistoryMetric.PROJECT_COMPLETED]: { label: 'Completed Projects', icon: 'pi pi-flag-fill', badgeSeverity: 'text-purple-500' },
    [HistoryMetric.PROJECT_VERIFIED]: { label: 'Verified Projects', icon: 'pi pi-flag-fill', badgeSeverity: 'text-purple-500' },
    [HistoryMetric.APPLICATION_SUBMITTED]: { label: 'Submitted Applications', icon: 'pi pi-send', badgeSeverity: 'text-blue-500' },
    [HistoryMetric.APPLICATION_ACCEPTED]: { label: 'Accepted Applications', icon: 'pi pi-check-circle', badgeSeverity: 'text-green-500' },
    [HistoryMetric.APPLICATION_REJECTED]: { label: 'Rejected Applications', icon: 'pi pi-times-circle', badgeSeverity: 'text-orange-500' },
};

export const HistoryRuleView: React.FC<HistoryRuleViewProps> = ({
    historyRule,
    title = "History Rule"
}) => {
    const formatRange = (range?: IRange): string | null => {
        if (!range) return null;

        const { min, max } = range;

        if (min !== undefined && max !== undefined) {
            return min === max ? `${min}` : `${min} - ${max}`;
        }

        if (min !== undefined) return `Min: ${min}`;
        if (max !== undefined) return `Max: ${max}`;

        return null;
    };

    const totalFields = historyRule.total?.fields || [];
    const totalRange = historyRule.total?.range;
    const hasValidRange = totalRange && (totalRange.min !== undefined || totalRange.max !== undefined);

    const projectFields = totalFields.filter((f) => f.startsWith('project.'));
    const applicationFields = totalFields.filter((f) => f.startsWith('application.'));

    const getMetricConfigs = (fields: HistoryMetric[]): HistoryMetricConfig[] => {
        return fields.map((field) => {
            const config = metricConfigMap[field] || {
                label: field,
                icon: 'pi pi-info-circle',
                badgeSeverity: 'text-primary'
            };
            return {
                ...config,
                range: totalRange
            };
        });
    };

    const projectMetrics = getMetricConfigs(projectFields);
    const applicationMetrics = getMetricConfigs(applicationFields);

    const renderMetrics = (metrics: HistoryMetricConfig[]) => (
        <div className="grid">
            {metrics.map((metric, index) => (
                <div
                    key={`${metric.label}-${index}`}
                    className="col-12 md:col-6 p-2"
                >
                    <div className="flex align-items-center p-2 border-round surface-50 border-1 border-200 h-full">
                        <i
                            className={`${metric.icon} ${metric.badgeSeverity} mr-3 text-xl`}
                        />

                        <div className="flex flex-column">
                            <span
                                className="text-500 font-bold uppercase"
                                style={{ fontSize: '10px' }}
                            >
                                {metric.label}
                            </span>

                            <span className="text-900 text-sm font-semibold">
                                {formatRange(metric.range)}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const hasMetrics = hasValidRange && totalFields.length > 0;

    return (
        <div className="history-rule-view p-3 surface-card border-round shadow-1">
            {/* Header */}
            <div className="flex justify-content-between align-items-start mb-2">
                <h4 className="mt-0 mb-1 text-primary flex align-items-center">
                    <i className="pi pi-history mr-2 text-xl" />
                    {historyRule.name || title}
                </h4>
                {historyRule.participation && (
                    <span className="text-xs bg-primary-reverse text-primary border-round px-2 py-1 font-bold uppercase border-1 border-primary">
                        Participation: {historyRule.participation}
                    </span>
                )}
            </div>

            {/* Description */}
            <p className="text-sm line-height-3 text-600 mb-3">
                {historyRule.description ||
                    'No specific description provided for this history rule.'}
            </p>

            {!hasMetrics ? (
                <div className="p-3 bg-blue-50 text-blue-700 border-round text-xs italic">
                    No historical thresholds or limits defined.
                </div>
            ) : (
                <>
                    {/* Project History */}
                    {projectMetrics.length > 0 && (
                        <>
                            <Divider align="left">
                                <span className="text-xs uppercase font-bold text-500 surface-100 px-2 py-1 border-round">
                                    Project History
                                </span>
                            </Divider>

                            {renderMetrics(projectMetrics)}
                        </>
                    )}

                    {/* Application History */}
                    {applicationMetrics.length > 0 && (
                        <>
                            <Divider align="left">
                                <span className="text-xs uppercase font-bold text-500 surface-100 px-2 py-1 border-round">
                                    Application History
                                </span>
                            </Divider>

                            {renderMetrics(applicationMetrics)}
                        </>
                    )}
                </>
            )}

            {/* Note */}
            <div className="mt-4 p-3 bg-yellow-50 border-left-3 border-yellow-500 border-round-right">
                <p className="m-0 text-xs text-yellow-800 line-height-2">
                    <strong>Note:</strong> Historical metrics are evaluated
                    against the applicant's previous project and application
                    records.
                </p>
            </div>
        </div>
    );
};