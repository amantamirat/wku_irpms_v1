'use client';
import React from 'react';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Timeline } from 'primereact/timeline';
import { Call } from '../calls/models/call.model';
import { CallStage } from '../calls/stages/models/call.stage.model';
import { Constraint } from '../grants/constraints/models/constraint.model';
import { Grant } from '../grants/models/grant.model';


interface CallDetailProps {
    call: Call;
    stages: CallStage[];
    constraints: Constraint[];
}

export default function CallDetailView({ call, stages, constraints }: CallDetailProps) {
    const grant = call.grant as Grant;

    // Format currency for the total amount
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    return (
        <div className="grid">
            {/* --- LEFT COLUMN: Description & Stages --- */}
            <div className="col-12 lg:col-8">
                <div className="card border-none shadow-1 p-4 mb-4">
                    <div className="flex justify-content-between align-items-start mb-3">
                        <div>
                            <h2 className="m-0 text-900 font-bold">{call.title}</h2>
                            <p className="text-600 mt-2 line-height-3">{call.description}</p>
                        </div>
                        <Tag severity={call.status === 'active' ? 'success' : 'info'} value={call.status.toUpperCase()} />
                    </div>

                    <Divider />

                    <h5 className="font-bold mb-4">Application Stages & Deadlines</h5>
                    <Timeline 
                        value={stages} 
                        align="left"
                        content={(item: CallStage) => (
                            <div className="ml-3 mb-5">
                                <div className="flex align-items-center gap-2">
                                    <span className="font-bold text-900">{(item.grantStage as any)?.name}</span>
                                    {item.status === 'active' && <Tag value="Current" severity="warning" rounded className="text-xs" />}
                                </div>
                                <div className="text-600 text-sm mt-1">
                                    <i className="pi pi-calendar mr-2 text-xs"></i>
                                    Deadline: {new Date(item.deadline).toLocaleDateString()}
                                </div>
                            </div>
                        )}
                        marker={(item) => (
                            <span className={`flex w-2rem h-2rem align-items-center justify-content-center border-circle z-1 shadow-1 
                                ${item.status === 'active' ? 'bg-primary' : 'bg-200'}`}>
                                <i className={`pi ${item.order === 1 ? 'pi-pencil' : 'pi-check'} text-sm`}></i>
                            </span>
                        )}
                    />
                </div>
            </div>

            {/* --- RIGHT COLUMN: Grant Info & Constraints --- */}
            <div className="col-12 lg:col-4">
                {/* Funding Card */}
                <Card className="mb-4 bg-primary text-white border-round-xl">
                    <div className="text-primary-100 mb-2 font-medium">Total Funding Available</div>
                    <div className="text-4xl font-bold mb-3">{formatCurrency(grant.amount)}</div>
                    <div className="text-sm opacity-80">
                        Source: <span className="font-bold">{(grant.fundingSource as any)?.name ?? 'Internal Fund'}</span>
                    </div>
                </Card>

                {/* Eligibility & Constraints */}
                <div className="card shadow-1 p-4">
                    <h5 className="font-bold mb-3"><i className="pi pi-exclamation-circle mr-2 text-primary"></i>Submission Rules</h5>
                    <ul className="list-none p-0 m-0">
                        {constraints.map((c, index) => (
                            <li key={index} className="flex align-items-start py-3 border-bottom-1 border-100 gap-3">
                                <div className="w-2rem h-2rem border-round surface-100 flex align-items-center justify-content-center flex-shrink-0">
                                    <i className={`pi ${getConstraintIcon(c.constraint)} text-primary text-sm`}></i>
                                </div>
                                <div>
                                    <span className="block font-medium text-900 text-sm">{formatConstraintName(c.constraint)}</span>
                                    <span className="text-600 text-xs">
                                        {c.min && `Min: ${c.min}`} {c.max && ` | Max: ${c.max}`}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                    
                    <Button 
                        label="Start Application" 
                        icon="pi pi-external-link" 
                        className="w-full mt-4 p-button-raised" 
                        disabled={call.status !== 'active'}
                    />
                </div>
            </div>
        </div>
    );
}

/** * HELPER FUNCTIONS for cleaner UI
 */
function getConstraintIcon(type?: string) {
    switch (type) {
        case "BUDGET-TOTAL": return "pi-money-bill";
        case "TIME-TOTAL": return "pi-hourglass";
        case "PARTICIPANT": return "pi-users";
        case "PHASE-COUNT": return "pi-sitemap";
        default: return "pi-info-circle";
    }
}

function formatConstraintName(type?: string) {
    if (!type) return "Constraint";
    return type.replace("-", " ").replace("_", " ").toLowerCase()
               .replace(/\b\w/g, s => s.toUpperCase());
}