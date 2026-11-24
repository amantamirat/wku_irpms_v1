
'use client';

import { useEffect, useMemo, useState } from 'react';
import { SelectButton } from 'primereact/selectbutton';

import { CalendarApi } from '@/app/(main)/calendars/api/calendar.api';
import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { Grant } from '@/app/(main)/grants/models/grant.model';
import { ReportApi } from './api/report.api';
import { IReportFilter } from './models/report.types';

import { OrganizationApi } from '../organizations/api/organization.api';
import { OrgnUnit } from '../organizations/models/organization.model';
import { CallApi } from '../calls/api/call.api';
import { StageApi } from '../calls/stages/api/stage.api';

import { ApplicationWidget } from './components/ApplicationWidget';
import { DirectorateWidget } from './components/DirectorateWidget';
import { EvaluationWidget } from './components/EvaluationWidget';
import { FinancialWidget } from './components/FinancialWidget';
import { ListDepartmentWidget } from './components/ListDepartmentWidget';
import { PortfolioWidget } from './components/PortfolioWidget';
import { ReportFilterPanel } from './components/ReportFilterPanel';
import { VerificationWidget } from './components/VerificationWidget';
import { useAuth } from '@/contexts/auth-context';
import { ResearcherWidget } from './components/ResearcherWidget';

type ReportType =
  | 'departments'
  | 'directorates'
  | 'portfolio'
  | 'applications'
  | 'evaluations'
  | 'verifications'
  | 'financial'
  | 'researchers';

const REPORT_OPTIONS: {
  label: string;
  value: ReportType;
  icon: string;
  permission: string;
}[] = [
    {
      label: 'Portfolio',
      value: 'portfolio',
      icon: 'pi pi-folder',
      permission: 'report:portfolio',
    },
    {
      label: 'Applications',
      value: 'applications',
      icon: 'pi pi-file-edit',
      permission: 'report:applications',
    },
    {
      label: 'Evaluations',
      value: 'evaluations',
      icon: 'pi pi-star',
      permission: 'report:evaluations',
    },
    {
      label: 'Verifications',
      value: 'verifications',
      icon: 'pi pi-verified',
      permission: 'report:verifications',
    },
    {
      label: 'Departments',
      value: 'departments',
      icon: 'pi pi-building',
      permission: 'report:departments',
    },
    {
      label: 'Directorates',
      value: 'directorates',
      icon: 'pi pi-sitemap',
      permission: 'report:directorates',
    },
    {
      label: 'Financials',
      value: 'financial',
      icon: 'pi pi-bitcoin',
      permission: 'report:financial',
    },
    {
      label: 'Researchers',
      value: 'researchers',
      icon: 'pi pi-users',
      permission: 'report:researcher',
    },
  ];

export default function ReportsPage() {
  // Permission hook
  const { hasPermission } = useAuth();

  // Filter reports based on user permissions
  const allowedReportOptions = useMemo(
    () =>
      REPORT_OPTIONS.filter((option) =>
        hasPermission(option.permission)
      ),
    [hasPermission]
  );

  const [selectedReport, setSelectedReport] =
    useState<ReportType | null>(null);

  const [filterForm, setFilterForm] = useState<IReportFilter>({});
  const [appliedFilter, setAppliedFilter] = useState<IReportFilter>({});

  const [grants, setGrants] = useState<Grant[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [workspaces, setWorkpaces] = useState<any[]>([]);
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Automatically select the first authorized report
  useEffect(() => {
    if (allowedReportOptions.length === 0) {
      setSelectedReport(null);
      setReportData(null);
      return;
    }

    const hasSelectedAccess = allowedReportOptions.some(
      (option) => option.value === selectedReport
    );

    if (!hasSelectedAccess) {
      setSelectedReport(allowedReportOptions[0].value);
    }
  }, [allowedReportOptions, selectedReport]);

  // Fetch filter lookup data
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [
          grantData,
          calendarData,
          departmentData,
          externalData,
          directorateData,
          callData,
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
        setWorkpaces([
          ...(departmentData || []),
          ...(externalData || []),
        ]);
        setDirectorates(directorateData || []);
        setCalls(callData || []);
      } catch (error) {
        console.error('Failed to load filter lookups:', error);
      }
    };

    fetchLookups();
  }, []);

  // Fetch stages whenever the selected call changes
  useEffect(() => {
    const callId = filterForm.call;

    if (!callId) {
      setStages([]);
      return;
    }

    let cancelled = false;

    const fetchStages = async () => {
      try {
        const stageData = await StageApi.lookup!({ call: callId });

        if (!cancelled) {
          setStages(stageData || []);
        }
      } catch (error) {
        console.error('Failed to load stages:', error);

        if (!cancelled) {
          setStages([]);
        }
      }
    };

    fetchStages();

    return () => {
      cancelled = true;
    };
  }, [filterForm.call]);

  // Fetch report data
  useEffect(() => {
    if (!selectedReport) return;

    // Ensure selected report is still authorized
    const authorized = allowedReportOptions.some(
      (option) => option.value === selectedReport
    );

    if (!authorized) {
      setReportData(null);
      return;
    }

    let cancelled = false;

    const fetchActiveReport = async () => {
      setLoading(true);
      setReportData(null);

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
          case 'researchers':
            data = await ReportApi.getResercherReport(appliedFilter);
            break;
        }

        if (!cancelled) {
          setReportData(data);
        }
      } catch (error) {
        console.error(
          `Failed to load ${selectedReport} report:`,
          error
        );

        if (!cancelled) {
          setReportData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchActiveReport();

    return () => {
      cancelled = true;
    };
  }, [selectedReport, appliedFilter, allowedReportOptions]);

  const handleApplyFilter = () => {
    setAppliedFilter({ ...filterForm });
  };

  const handleResetFilter = () => {
    setFilterForm({});
    setAppliedFilter({});
  };

  const reportItemTemplate = (option: {
    label: string;
    icon: string;
  }) => (
    <div className="flex items-center gap-2 py-1">
      <i className={option.icon} />
      <span className="text-sm font-medium">
        {option.label}
      </span>
    </div>
  );

  return (
    <div className="p-4 md:p-5 surface-ground min-h-screen flex flex-column gap-4">

      {/* PAGE HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-900 m-0">
          Institutional Reports Hub
        </h2>

        <span className="text-600 text-sm">
          Select a report module, apply filters, and query performance data.
        </span>
      </div>

      {/* NO PERMISSION */}
      {allowedReportOptions.length === 0 ? (
        <div className="surface-card shadow-1 p-5 border-round-xl text-center">
          <i className="pi pi-lock text-5xl text-500 mb-3" />

          <h3 className="text-xl font-bold text-900">
            No Reports Available
          </h3>

          <p className="text-600">
            You don't have permission to access any reports.
            Please contact your administrator.
          </p>
        </div>
      ) : (
        <>
          {/* REPORT TYPE SWITCHER */}
          <div className="surface-card shadow-1 p-3 border-round-xl overflow-x-auto">
            <SelectButton
              value={selectedReport}
              options={allowedReportOptions}
              onChange={(e) =>
                e.value && setSelectedReport(e.value)
              }
              optionLabel="label"
              itemTemplate={reportItemTemplate}
              className="p-button-sm flex-nowrap"
            />
          </div>

          {/* FILTER PANEL */}
          <ReportFilterPanel
            filterForm={filterForm}
            setFilterForm={setFilterForm}
            grants={grants}
            calendars={calendars}
            workspaces={workspaces}
            organizations={directorates}
            calls={calls}
            stages={stages}
            onApply={handleApplyFilter}
            onReset={handleResetFilter}
          />

          {/* REPORT RENDERER */}
          <div className="mt-2">

            {selectedReport === 'portfolio' &&
              <PortfolioWidget data={reportData} />}

            {selectedReport === 'applications' &&
              <ApplicationWidget
                data={reportData}
                loading={loading}
              />}

            {selectedReport === 'evaluations' &&
              <EvaluationWidget
                data={reportData}
                loading={loading}
              />}

            {selectedReport === 'verifications' &&
              <VerificationWidget
                data={reportData}
                loading={loading}
              />}

            {selectedReport === 'departments' &&
              <ListDepartmentWidget
                departments={reportData}
                loading={loading}
              />}

            {selectedReport === 'directorates' &&
              <DirectorateWidget data={reportData} />}

            {selectedReport === 'financial' &&
              <FinancialWidget data={reportData} />}

            {selectedReport === 'researchers' &&
            
              <ResearcherWidget data={reportData} loading={loading} />
              }

          </div>
        </>
      )}
    </div>
  );
}
