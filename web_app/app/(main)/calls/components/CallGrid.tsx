
import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Call } from '../models/call.model';
import { CallApi } from '../api/call.api';
import { Calendar } from '../../calendars/models/calendar.model';


export default function CallGrid() {


    const [calls, setCalls] = useState<Call[]>([]);

    useEffect(() => {
        CallApi.getCalls({})
            .then(data => setCalls(data))
            .catch(err => console.error('Failed to fetch calls of directorates', err));
    }, []);





    const header = (
        <img alt="Card" src="https://primefaces.org/cdn/primereact/images/usercard.png" />
    );
    const footer = (
        <>
            <Button label="Save" icon="pi pi-check" />
            <Button label="Cancel" severity="secondary" icon="pi pi-times" style={{ marginLeft: '0.5em' }} />
        </>
    );

    return (
        <div className="grid">
            {calls.map((call) => {
                

                const footer = (
                    <div className="flex justify-content-end gap-2">
                        <Button label="View" icon="pi pi-eye" />
                        <Button label="Apply" icon="pi pi-check" severity="success" />
                    </div>
                );

                return (
                    <div key={call._id} className="col-12 lg:col-6 xl:col-3">
                        <Card
                            title={call.title}
                            subTitle={`Deadline: ${new Date(
                                call.deadline
                            ).toLocaleDateString()}`}
                            header={header}
                            footer={footer}
                            className="mb-3"
                        >
                            <p className="m-0">
                                Call Year: {(call.calendar as Calendar).year}
                            </p>
                        </Card>
                    </div>
                );
            })}
        </div>

    )
}
