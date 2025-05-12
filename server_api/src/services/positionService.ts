import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import Position from '../models/position';
import PositionRank from '../models/positionRank';

interface PositionDTO {
    category: 'academic' | 'supportive';
    title: string;
}

interface RankDTO {
    positionTitle: string;
    ranks: string[];
}

interface SeedFileFormat {
    positions: PositionDTO[];
    positionRanks: RankDTO[];
}

const seedData = async () => {
    try {
        const filePath = path.join(__dirname, 'data', 'positions.json');
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