export class TransitionHelper {

    static validateTransition<T extends string>(
        current: T,
        next: T,
        transitions: Partial<Record<T, T[]>>
    ): void {

        const allowed = transitions[current] ?? [];

        if (!allowed.includes(next)) {
            throw new Error(`Invalid transition: ${current} → ${next}`);
        }
    }

}