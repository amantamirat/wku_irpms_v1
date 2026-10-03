'use client';

import { CalendarApi } from '@/app/(main)/calendars/api/calendar.api'; // Adjust path if needed based on your structure
import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { Grant } from '@/app/(main)/grants/models/grant.model';
import { SelectButton } from 'primereact/selectbutton';
import { useEffect, useState } from 'react';
import { ReportApi } from './api/report.api';
import { IReportFilter } from './models/report.types';

// Components & Widgets
import { OrganizationApi } from '../organizations/api/organization.api';
import { OrgnUnit } from '../organizations/models/organization.model';
import { ApplicationWidget } from './components/ApplicationWidget';
import { DirectorateWidget } from './components/DirectorateWidget';
import { EvaluationWidget } from './components/EvaluationWidget';
import { FinancialWidget } from './components/FinancialWidget';
import { ListDepartmentWidget } from './components/ListDepartmentWidget';
import { PortfolioWidget } from './components/PortfolioWidget';
import { ReportFilterPanel } from './components/ReportFilterPanel';
import { VerificationWidget } from './components/VerificationWidget';
import { CallApi } from '../calls/api/call.api';

type ReportType = 'departments' | 'directorates' | 'phases' | 'portfolio' | 'applications' | 'evaluations' | 'verifications' | 'financial';

const REPORT_OPTIONS = [
  { label: 'Portfolio', value: 'portfolio', icon: 'pi pi-folder' },
  { label: 'Applications', value: 'applications', icon: 'pi pi-file-edit' },
  { label: 'Evaluations', value: 'evaluations', icon: 'pi pi-star' },
  { label: 'Verifications', value: 'verifications', icon: 'pi pi-verified' },
  { label: 'Departments', value: 'departments', icon: 'pi pi-building' },
  { label: 'Directorates', value: 'directorates', icon: 'pi pi-sitemap' },
  { label: 'Financials', value: 'financial', icon: 'pi pi-bitcoin' },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('portfolio');
  const [filterForm, setFilterForm] = useState<IReportFilter>({});
  const [appliedFilter, setAppliedFilter] = useState<IReportFilter>({});

  const [grants, setGrants] = useState<Grant[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]); // Added calendar state
  const [workspaces, setWorkpaces] = useState<any[]>([]);
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch Grants and Calendars on Mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [grantData, calendarData, departmentData, externalData, directorateData,
          callData
        ] = await Promise.all([
          GrantApi.lookup ? GrantApi.lookup() : Promise.resolve([]),
          CalendarApi.lookup ? CalendarApi.lookup() : Promise.resolve([]),
          OrganizationApi.lookup!({ type: OrgnUnit.department }),
          OrganizationApi.lookup!({ type: OrgnUnit.external }),
          OrganizationApi.lookup!({ type: OrgnUnit.directorate }),
          CallApi.lookup!({}),
        ]);
        setGrants(grantData || []);
        setCalendars(calendarData || []);
        setWorkpaces([...departmentData, ...externalData]);
        setDirectorates(directorateData)
        setCalls(callData)
      } catch (err) {
        console.error('Failed to load filter lookups:', err);
      }
    };
    fetchLookups();
  }, []);

  // Fetch Data on Report Type or Applied Filter Change
  useEffect(() => {
    fetchActiveReport();
  }, [selectedReport, appliedFilter]);

  const fetchActiveReport = async () => {
    setLoading(true);
    try {
      let data = null;
      switch (selectedReport) {
        case 'portfolio':
          data = await ReportApi.getPortfolio(appliedFilter);
          break;
        case 'applications':
          data = await ReportApi.getApplications(appliedFilter);
          break;
        case 'evaluations':
          data = await ReportApi.getEvaluations(appliedFilter);
          break;
        case 'verifications':
          data = await ReportApi.getVerifications(appliedFilter);
          break;
        case 'directorates':
          data = await ReportApi.getDirectorateReport(appliedFilter);
          break;
        case 'financial':
          data = await ReportApi.getFinancial(appliedFilter);
          break;
        case 'departments':
          data = await ReportApi.getDepartmentReport(appliedFilter);
          break;
        case 'phases':
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

  const handleApplyFilter = () => setAppliedFilter({ ...filterForm });
  const handleResetFilter = () => {
    setFilterForm({});
    setAppliedFilter({});
  };

  const reportItemTemplate = (option: { label: string; icon: string }) => {
    return (
      <div className="flex items-center gap-2 py-1">
        <i className={option.icon} />
        <span className="text-sm font-medium">{option.label}</span>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-5 surface-ground min-h-screen flex flex-column gap-4">
      {/* PAGE HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-900 m-0">Institutional Reports Hub</h2>
        <span className="text-600 text-sm">Select a report module, apply filters, and query performance data.</span>
      </div>

      {/* REPORT TYPE SWITCHER */}
      <div className="surface-card shadow-1 p-3 border-round-xl overflow-x-auto">
        <SelectButton
          value={selectedReport}
          options={REPORT_OPTIONS}
          onChange={(e) => e.value && setSelectedReport(e.value)}
          optionLabel="label"
          itemTemplate={reportItemTemplate}
          className="p-button-sm flex-nowrap"
        />
      </div>

      {/* REUSABLE FILTER PANEL */}
      <ReportFilterPanel
        filterForm={filterForm}
        setFilterForm={setFilterForm}
        grants={grants}
        calendars={calendars}
        workspaces={workspaces}
        organizations={directorates}
        calls={calls}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

      {/* DYNAMIC REPORT RENDERER */}
      <div className="mt-2">
        {selectedReport === 'portfolio' && <PortfolioWidget data={reportData} />}
        {selectedReport === 'applications' && <ApplicationWidget data={reportData} loading={loading} />}
        {selectedReport === 'evaluations' && <EvaluationWidget data={reportData} loading={loading} />}
        {selectedReport === 'verifications' && <VerificationWidget data={reportData} loading={loading} />}
        {selectedReport === 'departments' && <ListDepartmentWidget departments={reportData} loading={loading} />}
        {selectedReport === 'directorates' && <DirectorateWidget data={reportData} />}
        {selectedReport === 'financial' && <FinancialWidget data={reportData} />}
      </div>
    </div>
  );
}