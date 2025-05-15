import fs from 'fs/promises';
import path from 'path';
import Sector from '../models/sector';
import Position, { Category } from '../models/position';
import PositionRank from '../models/rank';



export const seedPositions = async () => {
    interface PositionData {
        category: Category;
        position_title: string;
    }

    interface RankData {
        positionTitle: string;
        ranks: string[];
    }

    interface SeedFileFormat {
        positions: PositionData[];
        positionRanks: RankData[];
    }

    try {
        const filePath = path.join(process.cwd(), 'demo/data', 'positions.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { positions, positionRanks }: SeedFileFormat = JSON.parse(fileContent);

        const existing = await Position.find({});
        if (existing.length > 0) {
            console.log('Positions already exist. Skipping seed.');
            return;
        }

        const savedPositions = await Position.insertMany(positions);

        for (const group of positionRanks) {
            const pos = savedPositions.find(p => p.position_title === group.positionTitle);
            if (pos) {
                const ranksToInsert = group.ranks.map(rank => ({
                    position: pos._id,
                    rank_title: rank
                }));
                await PositionRank.insertMany(ranksToInsert);
            }
        }
        console.log('Position Data seeded successfully');
    } catch (err) {
        console.error('Error seeding data:', err);
        //throw err;
    }
};


export const seedSectors = async () => {
    interface SectorData {
        sector_name: string;
    }
    try {
        const filePath = path.join(process.cwd(), 'demo/data', 'sectors.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const sectors: SectorData[] = JSON.parse(fileContent);
        const existing = await Sector.find({});
        if (existing.length > 0) {
            console.log('Sectors already exist. Skipping seed.');
            return;
        }
        const savedPositions = await Sector.insertMany(sectors);
        console.log('Sector data seeded successfully');
    } catch (err) {
        console.error('Error seeding data:', err);
        //throw err;
    }
};




