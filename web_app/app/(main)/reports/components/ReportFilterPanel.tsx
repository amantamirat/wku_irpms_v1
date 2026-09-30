'use client';

import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { IReportFilter } from '../models/report.types';
import { Grant } from '@/app/(main)/grants/models/grant.model';

interface ReportFilterPanelProps {
    filterForm: IReportFilter;
    setFilterForm: React.Dispatch<React.SetStateAction<IReportFilter>>;
    grants: Grant[];
    calendars?: any[];
    workspaces?: any[];    // Added workspaces lookup data
    organizations?: any[]; // Added organizations lookup data
    onApply: () => void;
    onReset: () => void;
}

export const ReportFilterPanel: React.FC<ReportFilterPanelProps> = ({
    filterForm,
    setFilterForm,
    grants,
    calendars = [],
    workspaces = [],
    organizations = [],
    onApply,
    onReset,
}) => {
    return (
        <div className="surface-card shadow-1 p-4 border-round-xl">
            <h4 className="text-sm font-semibold text-700 m-0 mb-3 flex align-items-center gap-2">
                <i className="pi pi-filter text-primary" /> Filter Options
            </h4>

            <div className="grid align-items-end">
                {/* Grant Filter */}
                <div className="col-12 sm:col-6 lg:col-3">
                    <label className="text-700 font-medium text-xs block mb-1">Grant</label>
                    <Dropdown
                        value={filterForm.grant || ''}
                        options={grants}
                        onChange={(e) => setFilterForm({ ...filterForm, grant: e.value })}
                        optionLabel="title"
                        optionValue="_id"
                        placeholder="All Grants"
                        className="w-full p-inputtext-sm"
                        showClear
                    />
                </div>

                {/* Calendar Filter */}
                <div className="col-12 sm:col-6 lg:col-3">
                    <label className="text-700 font-medium text-xs block mb-1">Calendar</label>
                    <Dropdown
                        value={filterForm.calendar || ''}
                        options={calendars}
                        onChange={(e) => setFilterForm({ ...filterForm, calendar: e.value })}
                        optionLabel="year" // Adjust property if needed (e.g. title)
                        optionValue="_id"
                        placeholder="All Calendars"
                        className="w-full p-inputtext-sm"
                        showClear
                    />
                </div>

                {/* Workspace Filter */}
                <div className="col-12 sm:col-6 lg:col-3">
                    <label className="text-700 font-medium text-xs block mb-1">Workspace</label>
                    <Dropdown
                        value={filterForm.workspace || ''}
                        options={workspaces}
                        onChange={(e) => setFilterForm({ ...filterForm, workspace: e.value })}
                        optionLabel="name" 
                        optionValue="_id"
                        placeholder="All Workspaces"
                        className="w-full p-inputtext-sm"
                        showClear
                    />
                </div>

                {/* Organization Filter */}
                <div className="col-12 sm:col-6 lg:col-3">
                    <label className="text-700 font-medium text-xs block mb-1">Organization</label>
                    <Dropdown
                        value={filterForm.organization || ''}
                        options={organizations}
                        onChange={(e) => setFilterForm({ ...filterForm, organization: e.value })}
                        optionLabel="name" // Adjust property name based on Organization model (e.g., name, title)
                        optionValue="_id"
                        placeholder="All Organizations"
                        className="w-full p-inputtext-sm"
                        showClear
                    />
                </div>

                {/* Date From */}
                <div className="col-12 sm:col-6 lg:col-3">
                    <label className="text-700 font-medium text-xs block mb-1">Date From</label>
                    <PrimeCalendar
                        value={filterForm.dateFrom ? new Date(filterForm.dateFrom) : null}
                        onChange={(e) => setFilterForm({ ...filterForm, dateFrom: e.value as Date })}
                        placeholder="Start Date"
                        dateFormat="yy-mm-dd"
                        className="w-full p-inputtext-sm"
                        showIcon
                    />
                </div>

                {/* Date To */}
                <div className="col-12 sm:col-6 lg:col-3">
                    <label className="text-700 font-medium text-xs block mb-1">Date To</label>
                    <PrimeCalendar
                        value={filterForm.dateTo ? new Date(filterForm.dateTo) : null}
                        onChange={(e) => setFilterForm({ ...filterForm, dateTo: e.value as Date })}
                        placeholder="End Date"
                        dateFormat="yy-mm-dd"
                        className="w-full p-inputtext-sm"
                        showIcon
                    />
                </div>

                {/* Actions */}
                <div className="col-12 lg:col-6 flex gap-2 justify-content-end">
                    <Button
                        label="Reset"
                        icon="pi pi-refresh"
                        className="p-button-outlined p-button-secondary p-button-sm w-full sm:w-auto"
                        onClick={onReset}
                    />
                    <Button
                        label="Apply Filter"
                        icon="pi pi-search"
                        className="p-button-primary p-button-sm w-full sm:w-auto"
                        onClick={onApply}
                    />
                </div>
            </div>
        </div>
    );
};