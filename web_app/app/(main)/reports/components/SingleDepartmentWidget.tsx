'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Badge } from 'primereact/badge';
import { Chart } from 'primereact/chart';
import { etbCurrencyFormatter } from '@/utils/utils';
import { IDepartmentReport } from '../models/report.types';
import { ArticleSkeleton } from '@/components/Skeletons';

interface Props {
    department?: IDepartmentReport | null;
    loading?: boolean;
}

const compactMoney = (value: number) => {
    const v = value || 0;
    const abs = Math.abs(v);
    if (abs >= 1_000_000_000) return `ETB ${(v / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `ETB ${(v / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `ETB ${(v / 1_000).toFixed(0)}K`;
    return `ETB ${v.toFixed(0)}`;
};

export const SingleDepartmentWidget = ({ department, loading = false }: Props) => {
    if (loading) return <ArticleSkeleton />;

    if (!department) {
        return (
            <Card className="shadow-1 border-round-xl text-center p-3">
                <i className="pi pi-building text-2xl text-400 mb-2" />
                <h4 className="m-0 text-sm font-semibold text-700">No Department Selected</h4>
            </Card>
        );
    }

    const totalProjects = department.projects || 0;
    const completed = department.completed || 0;
    const approved = department.approved || 0;
    const granted = department.granted || 0;
    const terminated = department.terminated || 0;
    const totalBudget = department.totalBudget || 0;
    const completionRate = totalProjects > 0 ? Math.round((completed / totalProjects) * 100) : 0;

    // Mini Doughnut chart configuration for project distribution status
    const chartData = {
        labels: ['Approved', 'Granted', 'Completed', 'Terminated'],
        datasets: [
            {
                data: [approved, granted, completed, terminated],
                backgroundColor: ['#3b82f6', '#6366f1', '#10b981', '#f43f5e'],
                hoverBackgroundColor: ['#2563eb', '#4f46e5', '#059669', '#e11d48'],
            },
        ],
    };

    const chartOptions = {
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
        },
        cutout: '70%',
        maintainAspectRatio: false,
    };

    return (
        <Card className="shadow-1 border-round-xl surface-card h-full flex flex-column justify-between p-0">
            <div>
                {/* Header Row */}
                <div className="flex align-items-center justify-content-between mb-3 pb-2 border-bottom-1 surface-border">
                    <div className="flex align-items-center gap-2">
                        <div className="flex h-2rem w-2rem align-items-center justify-content-center bg-primary-50 text-primary border-round-lg">
                            <i className="pi pi-building text-sm" />
                        </div>
                        <h4 className="text-sm font-bold text-900 m-0 text-overflow-ellipsis" title={department.name}>
                            {department.name}
                        </h4>
                    </div>
                    <Tag severity="info" value={`${totalProjects} Projects`} className="text-xs font-semibold px-2 py-1" />
                </div>

                {/* Content Layout: Metrics Grid Left, Mini Donut Chart Right */}
                <div className="grid align-items-center mb-3">
                    {/* Compact Metrics Breakdown */}
                    <div className="col-7 flex flex-column gap-2">
                        <div className="bg-surface-50 p-2 border-round-lg">
                            <span className="block text-xs text-500 font-medium">Total Budget</span>
                            <span className="text-sm font-bold text-900" title={etbCurrencyFormatter.format(totalBudget)}>
                                {compactMoney(totalBudget)}
                            </span>
                        </div>

                        <div className="flex gap-1">
                            <Badge value={`Appr: ${approved}`} severity="info" className="text-xs flex-1" />
                            <Badge value={`Grant: ${granted}`} severity="warning" className="text-xs flex-1" />
                        </div>
                        <div className="flex gap-1">
                            <Badge value={`Comp: ${completed}`} severity="success" className="text-xs flex-1" />
                            <Badge value={`Term: ${terminated}`} severity="danger" className="text-xs flex-1" />
                        </div>
                    </div>

                    {/* Chart Right */}
                    <div className="col-5 flex justify-content-center" style={{ height: '90px' }}>
                        <Chart type="doughnut" data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* Completion Progress Bar */}
                <div className="mt-2 pt-2 border-top-1 surface-border">
                    <div className="flex justify-content-between text-xs mb-1 font-medium">
                        <span className="text-600">Completion Progress</span>
                        <span className="text-success font-bold">{completionRate}%</span>
                    </div>
                    <ProgressBar
                        value={completionRate}
                        showValue={false}
                        style={{ height: '6px' }}
                        className="bg-surface-200"
                    />
                </div>
            </div>
        </Card>
    );
};