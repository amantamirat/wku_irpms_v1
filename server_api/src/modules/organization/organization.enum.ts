// Enum for Organization Types
export enum Unit {
    College = 'College',//base
    Department = 'Department',//child
    Program = 'Program',//child
    Directorate = 'Directorate',//base
    Center = 'Center',//child
    External = 'External',//base
}

export enum AcademicLevel {
    BA = 'BA',
    BSc = 'BSc',
    BT = 'BT',
    MA = 'MA',
    MSc = 'MSc',
    MPhil = 'MPhil',
    MT = 'MT',
    PhD = 'PhD',
    PostDoc = 'PostDoc'
}

export enum Classification {
    Regular = 'Regular',
    Weekend = 'Weekend',
    Evening = 'Evening',
}

export enum Ownership {
    Internal = 'Internal',
    Private = 'Private',
    Public = 'Public',
    NGO = 'NGO',
}
