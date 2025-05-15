import fs from 'fs/promises';
import path from 'path';
import Sector from '../models/sector';
import Position, { Category } from '../models/position';
import PositionRank from '../models/rank';
import { Permission } from '../models/permission.model';

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

export const seedPositionRankData = async () => {
    try {
        const filePath = path.join(process.cwd(), 'data', 'positions.json');
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

interface SectorData {
    sector_name: string;
}

export const seedSectorData = async () => {
    try {
        const filePath = path.join(process.cwd(), 'data', 'sectors.json');
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



export const seedPermissions = async () => {
    const filePath = path.join(__dirname, 'data', 'permissions.json');
    const rawData = await fs.readFile(filePath, 'utf-8');
    const permissions = JSON.parse(rawData);

    for (const perm of permissions) {
        const exists = await Permission.findOne({ name: perm.name });
        if (!exists) {
            await new Permission(perm).save();
        }
    }

    console.log('Permissions seeded from JSON');
};