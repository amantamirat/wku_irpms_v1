'use client';

import ConfirmDialog from '@/components/ConfirmationDialog';
import ErrorComponent from '@/components/ErrorComponent';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Call } from '../../calls/models/call.model';
import { GetProjectsOptions, ProjectApi } from '../api/project.api';
import { Project } from '../models/project.model';
import SaveProjectDialog from './SaveProjectDialog';
import ProjectDetail from './ProjectDetail';
import Badge from '@/templates/Badge';

interface ProjectManagerProps {
    call?: Call;
}

const ProjectManager = (props: ProjectManagerProps) => {
    const { call } = props
    const emptyProject: Project = {
        call: call || '',
        title: ''
    };
    const [projects, setProjects] = useState<Project[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedProject, setSelectedProject] = useState<Project>(emptyProject);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);


    const fetchProjects = useCallback(async () => {
        try {
            const options: GetProjectsOptions = {};
            options.call = call ? call._id : undefined;
            const data = await ProjectApi.getProjects(options);
            setProjects(data);
        } catch (err) {
            setError(`Failed to load projects data ${err}`);
        }
    }, [call]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    if (error) {
        return (
            <ErrorComponent errorMessage={error} />
        );
    }

    const onSaveComplete = (savedProject: Project) => {
        let _projects = [...projects]; // projects is your local state array of Project
        const index = _projects.findIndex((p) => p._id === savedProject._id);

        if (index !== -1) {
            // Replace existing project
            _projects[index] = { ...savedProject };
        } else {
            // Add new project
            _projects.push({ ...savedProject });
        }

        setProjects(_projects); // update state
        hideDialogs();
    };

    const deleteProject = async () => {
        const deleted = await ProjectApi.deleteProject(selectedProject);
        if (deleted) {
            setProjects(projects.filter((c) => c._id !== selectedProject._id));
            hideDialogs();
        }
    };


    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setSelectedProject(emptyProject);
    }

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New Project" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedProject(emptyProject);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Projects</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Project) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedProject(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedProject(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );


    const statusBodyTemplate = (rowData: Project) => {
        return (
            <Badge type="status" value={rowData.status ?? 'Unknown'} />
        );
    };


    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>
                    <DataTable
                        ref={dt}
                        value={projects}
                        selection={selectedProject}
                        onSelectionChange={(e) => setSelectedProject(e.value as Project)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} projects"
                        globalFilter={globalFilter}
                        emptyMessage="No project data found."
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(rowData) => {
                            return <ProjectDetail project={rowData as Project} />;
                        }}
                    >
                        <Column expander headerStyle={{ width: '3em' }}></Column>
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        
                        <Column field="title" header="Title" sortable />
                        <Column header="Status" body={statusBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedProject && (
                        <SaveProjectDialog
                            visible={showSaveDialog}
                            project={selectedProject}
                            onComplete={onSaveComplete}
                            onHide={hideDialogs}
                        />
                    )}

                    {selectedProject && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedProject.title)}
                            onConfirmAsync={deleteProject}
                            onHide={hideDialogs}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectManager;
