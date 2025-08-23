'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CallManager from './components/CallManager';



const CallPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();


    const directorateId = searchParams.get('id');
    const directorateName = searchParams.get('name');

    if (!directorateId || !directorateName) {
        router.push('/auth/error');
        return null;
    }

    const directorate = {
        _id: directorateId,
        name: directorateName
    };

    return (
        <CallManager directorate={directorate} />
    );
};

export default CallPage;
