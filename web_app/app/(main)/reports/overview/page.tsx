'use client';
import { useEffect, useRef, useState } from "react";
import { InstitutionalOverviewDTO } from "../models/overview.model";
import { ReportApi } from "../api/report.api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Chart } from "primereact/chart";
import ErrorCard from "@/components/ErrorCard";

export default function InstitutionalOverviewPage() {

    const dashboardRef = useRef<HTMLDivElement>(null);

    const [overview, setOverview] = useState<InstitutionalOverviewDTO | null>(null);
    const [loading, setLoading] = useState(false);

    const [filter, setFilter] = useState({
        grantType: undefined,
        startDate: undefined,
        endDate: undefined,
    });

    const [chartData, setChartData] = useState<any>({});
    const [chartOptions, setChartOptions] = useState<any>({});
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        loadOverview();
    }, []);

    useEffect(() => {
        if (!overview) return;

        const documentStyle = getComputedStyle(document.documentElement);

        const data = {
            labels: ["Submitted", "Granted", "Completed", "Published"],
            datasets: [
                {
                    data: [
                        overview.submittedProjects || 0,
                        overview.grantedProjects || 0,
                        overview.completedProjects || 0,
                        overview.publishedProjects || 0
                    ],
                    backgroundColor: [
                        documentStyle.getPropertyValue('--blue-500'),
                        documentStyle.getPropertyValue('--green-500'),
                        documentStyle.getPropertyValue('--orange-500'),
                        documentStyle.getPropertyValue('--purple-500')
                    ],
                    hoverBackgroundColor: [
                        documentStyle.getPropertyValue('--blue-400'),
                        documentStyle.getPropertyValue('--green-400'),
                        documentStyle.getPropertyValue('--orange-400'),
                        documentStyle.getPropertyValue('--purple-400')
                    ]
                }
            ]
        };

        const options = {
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true
                    }
                }
            }
        };

        setChartData(data);
        setChartOptions(options);
    }, [overview]);

    const loadOverview = async () => {
        try {
            setLoading(true);
            const data = await ReportApi.getOverview(filter);
            setOverview(data);
        } catch (err: any) {
            console.error(err);
            setError("Failed to fetch report. " + (err.message ?? ""));
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <ErrorCard errorMessage={error} />
        )
    }

    const exportToExcel = () => {
        if (!overview) return;

        const worksheet = XLSX.utils.json_to_sheet([overview]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Overview");

        const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const file = new Blob([buffer], { type: "application/octet-stream" });

        saveAs(file, "institutional-overview.xlsx");
    };

    const exportToPDF = async () => {
        if (!dashboardRef.current) return;

        const canvas = await html2canvas(dashboardRef.current);
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save("institutional-overview.pdf");
    };

    // ================= KPI CARD COMPONENT =================
    function KpiCard({ title, value }: any) {
        return (
            <div className="col-12 md:col-3">
                <Card className="text-center shadow-3 border-round-xl">
                    <h5 className="text-500">{title}</h5>
                    <h2 className="mt-2 text-primary">{value ?? 0}</h2>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* ================= FILTER PANEL ================= */}
            <Card className="mb-4 shadow-2">
                <div className="grid align-items-end">

                    <div className="col-12 md:col-3">
                        <Dropdown
                            value={filter.grantType}
                            options={[
                                { label: "Internal", value: "internal" },
                                { label: "External", value: "external" }
                            ]}
                            placeholder="Grant Type"
                            onChange={(e) => setFilter({ ...filter, grantType: e.value })}
                            className="w-full"
                        />
                    </div>

                    <div className="col-12 md:col-3">
                        <Calendar
                            value={filter.startDate}
                            placeholder="Start Date"
                            showIcon
                            className="w-full"
                            onChange={(e: any) => setFilter({ ...filter, startDate: e.value })}
                        />
                    </div>

                    <div className="col-12 md:col-3">
                        <Calendar
                            value={filter.endDate}
                            placeholder="End Date"
                            showIcon
                            className="w-full"
                            onChange={(e: any) => setFilter({ ...filter, endDate: e.value })}
                        />
                    </div>

                    <div className="col-12 md:col-3">
                        <Button
                            label="Apply Filters"
                            icon="pi pi-filter"
                            className="w-full"
                            onClick={loadOverview}
                        />
                    </div>

                </div>
            </Card>

            {/* ================= DASHBOARD CONTENT ================= */}
            <div ref={dashboardRef}>

                {/* KPI CARDS */}
                <div className="grid mb-4">
                    <KpiCard title="Total Projects" value={overview?.totalProjects} />
                    <KpiCard title="Granted Projects" value={overview?.grantedProjects} />
                    <KpiCard title="Completion Rate" value={`${overview?.completionRate ?? 0}%`} />
                    <KpiCard title="Total Funding" value={overview?.totalFundingSecured} />
                </div>

                {/* PIE CHART */}
                {overview && (
                    <Card className="shadow-2">
                        <div className="card flex justify-content-center">
                            <Chart type="pie" data={chartData} options={chartOptions} className="w-full md:w-30rem" />
                        </div>
                    </Card>
                )}

            </div>

            {/* ================= EXPORT BUTTONS ================= */}
            <div className="flex gap-3 mt-4">
                <Button
                    label="Export to Excel"
                    icon="pi pi-file-excel"
                    className="p-button-success"
                    onClick={exportToExcel}
                />

                <Button
                    label="Export to PDF"
                    icon="pi pi-file-pdf"
                    className="p-button-danger"
                    onClick={exportToPDF}
                />
            </div>
        </div>
    );
}