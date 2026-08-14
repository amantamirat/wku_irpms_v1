'use client';

import { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { Grant } from '@/app/(main)/grants/models/grant.model';
import { IReportFilter } from './models/report.types';
import { ReportApi } from './api/report.api';

// Widget Imports
import { ReportDashboard } from './components/Dashboard';
import { DepartmentWidget } from './components/DepartmentWidget';
import { PhaseWidget } from './components/PhaseWidget';
import { PortfolioWidget } from './components/PortfolioWidget';
import { ApplicationWidget } from './components/ApplicationWidget';
import { FinancialWidget } from './components/FinancialWidget';

// Available Report Types
type ReportType = 'dashboard' | 'departments' | 'phases' | 'portfolio' | 'applications' | 'financial';

const REPORT_OPTIONS = [
  { label: 'Dashboard Overview', value: 'dashboard', icon: 'pi pi-th-large' },
  { label: 'Department Analytics', value: 'departments', icon: 'pi pi-building' },
  { label: 'Phase Progress', value: 'phases', icon: 'pi pi-sitemap' },
  { label: 'Portfolio Detail', value: 'portfolio', icon: 'pi pi-folder' },
  { label: 'Applications', value: 'applications', icon: 'pi pi-file-edit' },
  { label: 'Financials', value: 'financial', icon: 'pi pi-dollar' },
];

export default function ReportsPage() {
  // 1. REPORT SELECTION STATE
  const [selectedReport, setSelectedReport] = useState<ReportType>('dashboard');

  // 2. FILTER FORM STATE (Staging changes before apply)
  const [filterForm, setFilterForm] = useState<IReportFilter>({});
  
  // 3. APPLIED FILTER STATE (Triggers API fetch)
  const [appliedFilter, setAppliedFilter] = useState<IReportFilter>({});

  // 4. DATA & LOADING STATES
  const [grants, setGrants] = useState<Grant[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch Grants for the Dropdown on Mount
  useEffect(() => {
    const fetchGrants = async () => {
      try {
        const data = await GrantApi.getAll({ populate: true });
        setGrants(data || []);
      } catch (err) {
        console.error('Failed to load grants:', err);
      }
    };
    fetchGrants();
  }, []);

  // Fetch data whenever selectedReport or appliedFilter changes
  useEffect(() => {
    fetchActiveReport();
  }, [selectedReport, appliedFilter]);

  const fetchActiveReport = async () => {
    // Dashboard fetches its own sub-widgets internally
    if (selectedReport === 'dashboard') return;

    setLoading(true);
    try {
      let data = null;
      switch (selectedReport) {
        case 'departments':
          data = await ReportApi.getDepartments(appliedFilter);
          break;
        case 'portfolio':
          data = await ReportApi.getPortfolio(appliedFilter);
          break;
        case 'applications':
          data = await ReportApi.getApplications(appliedFilter);
          break;
        case 'financial':
          // Optional endpoint execution
          break;
        case 'phases':
          // Optional endpoint execution
          break;
      }
      setReportData(data);
    } catch (error) {
      console.error(`Failed to load ${selectedReport} report:`, error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedFilter({ ...filterForm });
  };

  const handleResetFilter = () => {
    setFilterForm({});
    setAppliedFilter({});
  };

  return (
    <div className="p-4 md:p-5 surface-ground min-h-screen flex flex-column gap-4">
      {/* PAGE HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-900 m-0">Institutional Reports Hub</h2>
        <span className="text-600 text-sm">Select a report module, apply filters, and query performance data.</span>
      </div>

      {/* 1. REPORT TYPE SWITCHER */}
      <div className="surface-card shadow-1 p-3 border-round-xl overflow-x-auto">
        <SelectButton
          value={selectedReport}
          options={REPORT_OPTIONS}
          onChange={(e) => e.value && setSelectedReport(e.value)}
          optionLabel="label"
          className="p-button-sm flex-nowrap"
        />
      </div>

      {/* 2. FILTER PANEL */}
      <div className="surface-card shadow-1 p-4 border-round-xl">
        <h4 className="text-sm font-semibold text-700 m-0 mb-3 flex align-items-center gap-2">
          <i className="pi pi-filter text-primary" /> Filter Options
        </h4>

        <div className="grid align-items-end">
          {/* Grant Filter */}
          <div className="col-12 sm:col-6 lg:col-3">
            <label className="text-700 font-medium text-xs block mb-1">Grant</label>
            <Dropdown
              value={filterForm.grant}
              options={grants}
              onChange={(e) => setFilterForm({ ...filterForm, grant: e.value })}
              optionLabel="title"
              optionValue="_id"
              placeholder="All Grants"
              className="w-full p-inputtext-sm"
              showClear
            />
          </div>

          {/* Date From */}
          <div className="col-12 sm:col-6 lg:col-3">
            <label className="text-700 font-medium text-xs block mb-1">Date From</label>
            <Calendar
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
            <Calendar
              value={filterForm.dateTo ? new Date(filterForm.dateTo) : null}
              onChange={(e) => setFilterForm({ ...filterForm, dateTo: e.value as Date })}
              placeholder="End Date"
              dateFormat="yy-mm-dd"
              className="w-full p-inputtext-sm"
              showIcon
            />
          </div>

          {/* Actions */}
          <div className="col-12 lg:col-3 flex gap-2 justify-content-end">
            <Button
              label="Reset"
              icon="pi pi-refresh"
              className="p-button-outlined p-button-secondary p-button-sm w-full sm:w-auto"
              onClick={handleResetFilter}
            />
            <Button
              label="Apply Filter"
              icon="pi pi-search"
              className="p-button-primary p-button-sm w-full sm:w-auto"
              onClick={handleApplyFilter}
            />
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC REPORT RENDERER */}
      <div className="mt-2">
        {selectedReport === 'dashboard' && <ReportDashboard filter={appliedFilter} />}
        {selectedReport === 'departments' && <DepartmentWidget departments={reportData} loading={loading} />}
        {selectedReport === 'portfolio' && <PortfolioWidget data={reportData} />}
        {selectedReport === 'applications' && <ApplicationWidget data={reportData} loading={loading} />}
        {selectedReport === 'financial' && <FinancialWidget data={reportData} />}
        {selectedReport === 'phases' && <PhaseWidget data={reportData} loading={loading} />}
      </div>
    </div>
  );
}