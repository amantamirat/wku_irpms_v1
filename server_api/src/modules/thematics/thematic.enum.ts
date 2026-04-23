/*
export enum ThemeType {
    theme = 'Theme',
    component = 'Component'
}
*/

export enum ThematicLevel {
    broad = 'Broad',
    divison = 'Division',
    narrow = 'Narrow',//focus-area
    deep = 'Deep',//priority-area
}

export const themeLevelIndex: Record<ThematicLevel, number> = {
    [ThematicLevel.broad]: 0,
    [ThematicLevel.divison]: 1,
    [ThematicLevel.narrow]: 2,
    [ThematicLevel.deep]: 3,
};