'use client';

import React from 'react';
import { Divider } from 'primereact/divider';
import { HistoryRule } from '../models/history.model';
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

    const projectMetrics: HistoryMetricConfig[] = [
        {
            label: 'Granted Projects',
            icon: 'pi pi-check-circle',
            range: historyRule.project?.granted,
            badgeSeverity: 'text-green-500'
        },
        {
            label: 'Refused Projects',
            icon: 'pi pi-ban',
            range: historyRule.project?.refused,
            badgeSeverity: 'text-red-500'
        },
        {
            label: 'Completed Projects',
            icon: 'pi pi-flag-fill',
            range: historyRule.project?.completed,
            badgeSeverity: 'text-purple-500'
        }
    ].filter(
        (metric) =>
            metric.range !== undefined &&
            (metric.range.min !== undefined || metric.range.max !== undefined)
    );

    const applicationMetrics: HistoryMetricConfig[] = [
        {
            label: 'Submitted Applications',
            icon: 'pi pi-send',
            range: historyRule.application?.submitted,
            badgeSeverity: 'text-blue-500'
        },
        {
            label: 'Accepted Applications',
            icon: 'pi pi-check-circle',
            range: historyRule.application?.accepted,
            badgeSeverity: 'text-green-500'
        },
        {
            label: 'Rejected Applications',
            icon: 'pi pi-times-circle',
            range: historyRule.application?.rejected,
            badgeSeverity: 'text-orange-500'
        }
    ].filter(
        (metric) =>
            metric.range !== undefined &&
            (metric.range.min !== undefined || metric.range.max !== undefined)
    );

    const renderMetrics = (metrics: HistoryMetricConfig[]) => (
        <div className="grid">
            {metrics.map((metric) => (
                <div
                    key={metric.label}
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

    const hasMetrics =
        projectMetrics.length > 0 || applicationMetrics.length > 0;

    return (
        <div className="history-rule-view p-3 surface-card border-round shadow-1">
            {/* Header */}
            <h4 className="mt-0 mb-1 text-primary flex align-items-center">
                <i className="pi pi-history mr-2 text-xl" />
                {historyRule.name || title}
            </h4>

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

