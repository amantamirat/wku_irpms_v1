import path from "path";
import fs from 'fs/promises';
import { PhaseEquipmentDto } from "../../../modules/projects/phase/equipments/phase-equipment.dto";
import { EquipmentUnit, PhaseEquipmentStatus } from "../../../modules/projects/phase/equipments/phase-equipment.model";
import { Phase, PhaseStatus } from "../../../modules/projects/phase/phase.model";

interface LegacyEquipment {
    equipmentId: string;
    name: string;
    unit: string;
    unitCost: number;
    quantity: number;
    totalCost: number;
}

interface LegacyPhaseEquipment {
    phaseNo: number;
    equipment: LegacyEquipment[];
}

interface LegacyProjectEquipment {
    conceptNoteId: string;
    conceptNoteCode: string;
    title: string;
    phases: LegacyPhaseEquipment[];
}

export class LegacyEquipmentLoader {

    private index = new Map<string, LegacyProjectEquipment>();

    async loadFromFile(relativePath = "data/legacy/equipments.json") {
        const filePath = path.join(process.cwd(), relativePath);
        const raw = await fs.readFile(filePath, "utf-8");

        const normalized = raw
            .replace(/-Infinity\b/g, "null")
            .replace(/\bInfinity\b/g, "null")
            .replace(/\bNaN\b/g, "null");

        const data: LegacyProjectEquipment[] = JSON.parse(normalized);

        this.index = new Map(
            data.map(p => [String(p.conceptNoteId).trim().toUpperCase(), p])
        );
    }

    private getEquipmentStatus(phaseStatus: PhaseStatus) {
        if (phaseStatus === PhaseStatus.completed) {
            return PhaseEquipmentStatus.delivered;
        }
        return PhaseEquipmentStatus.approved;
    }

    getByPhase(conceptNoteId: string, phaseNo: number, phaseStatus: PhaseStatus): PhaseEquipmentDto[] {
        const project = this.index.get(
            String(conceptNoteId).trim().toUpperCase()
        );
        if (!project) return [];

        const phase = project.phases.find(p => p.phaseNo === phaseNo);
        if (!phase?.equipment?.length) return [];

        return phase.equipment
            .filter(item =>
                item.name?.trim() &&
                Number.isFinite(item.unitCost) &&
                Number.isFinite(item.quantity) &&
                item.quantity > 0          // drops the 0-quantity rows
            )
            .map(item => {
                const name = item.name.trim();
                const status = this.getEquipmentStatus(phaseStatus);
                return {
                    itemName: name,
                    description: name,
                    unit: this.mapEquipmentUnit(item.unit),
                    unitPrice: this.toNumber(item.unitCost),
                    packSize: this.parsePackSize(name),   // from name, not unit
                    quantity: this.toNumber(item.quantity),
                    status: status,
                };
            });
    }

    private parsePackSize(name?: string | null): number {
        if (!name) return 1;
        const text = name.trim().toLowerCase();

        // "4*30ml" -> per-unit size 30 (check first, before the plain volume match)
        const mult = text.match(/(\d+(?:\.\d+)?)\s*\*\s*(\d+(?:\.\d+)?)\s*(?:ml|l|g|gm|kg)?/);
        if (mult) return this.toNumber(mult[2], 1) || 1;

        const weight = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilogram|gm|grams?|g)\b/);
        if (weight) return this.toNumber(weight[1], 1) || 1;

        const volume = text.match(/(\d+(?:\.\d+)?)\s*(?:ml|millilit(?:re|er)|litre|liter|l)\b/);
        if (volume) return this.toNumber(volume[1], 1) || 1;

        return 1;
    }

    private toNumber(value: unknown, fallback = 0): number {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    private mapEquipmentUnit(unit?: string | null): EquipmentUnit {
        switch (unit?.trim().toLowerCase()) {
            case "meter":
                return EquipmentUnit.meter;
            case "liter":
            case "litre":
            case "litter":     // typo present in your data
                return EquipmentUnit.liter;
            case "kilogram":
            case "kg":
                return EquipmentUnit.kilogram;
            default:
                return EquipmentUnit.number;
        }
    }
}