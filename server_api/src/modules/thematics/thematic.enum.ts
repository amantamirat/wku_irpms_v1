/*
export enum ThemeType {
    theme = 'Theme',
    component = 'Component'
}
*/

export enum ThemeLevel {
    broad = 'Broad',
    divison = 'Division',
    narrow = 'Narrow',//focus-area
    deep = 'Deep',//priority-area
    //crossCutting="Cross Cutting"
}

export const themeLevelIndex: Record<ThemeLevel, number> = {
    [ThemeLevel.broad]: 0,
    [ThemeLevel.divison]: 1,
    [ThemeLevel.narrow]: 2,
    [ThemeLevel.deep]: 3,
};