import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import Position, { Category } from '../models/position';
import PositionRank from '../models/rank';

interface PositionData {
    category: Category;
    title: string;
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
        const filePath = path.join(__dirname, 'data', '../data/position.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { positions, positionRanks }: SeedFileFormat = JSON.parse(fileContent);

        const existing = await Position.find({});
        if (existing.length > 0) {
            console.log('Positions already exist. Skipping seed.');
            return;
        }

        const savedPositions = await Position.insertMany(positions);

        for (const group of positionRanks) {
            const pos = savedPositions.find(p => p.title === group.positionTitle);
            if (pos) {
                const ranksToInsert = group.ranks.map(rank => ({
                    position: pos._id,
                    rank
                }));
                await PositionRank.insertMany(ranksToInsert);
            }
        }

        console.log('Database seeded successfully');
    } catch (err) {
        console.error('Error seeding data:', err);
    }
};