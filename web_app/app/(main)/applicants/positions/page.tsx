'use client';
import PositionManager from './components/PositionManager';
import { PositionType } from './models/position.model';

const PositionPage = () => {

    return (
        <PositionManager posType={PositionType.position}/>
    );
};

export default PositionPage;
