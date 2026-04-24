import { User } from "../../models/user.model";

/* =======================
   Publication Type Enum
======================= */
export enum PublicationType {
    JournalArticle = "Journal Article",
    ConferencePaper = "Conference Paper",
    BookChapter = "Book Chapter",
    Book = "Book",
    Thesis = "Thesis / Dissertation",
    TechnicalReport = "Technical Report",
    Patent = "Patent",
    MagazineArticle = "Magazine Article",
    WhitePaper = "White Paper",
    Poster = "Poster",
    Preprint = "Preprint",
    Software = "Software",
    Other = "Other",
}

/* =======================
   Publication Model
======================= */
export type Publication = {
    _id?: string;
    author?: string | User;
    title?: string;
    type?: PublicationType;
    abstract?: string;
    publishedDate?: string | Date;
    doi?: string;
    url?: string;
    publisher?: string;
    publicationId?: string;
    document?: File | null;
    createdAt?: Date;
    updatedAt?: Date;
};

/* =======================
   Validation
======================= */
export const validatePublication = (
    publication: Publication
): { valid: boolean; message?: string } => {

    if (!publication.author) {
        return { valid: false, message: 'Author is required.' };
    }

    if (!publication.title) {
        return { valid: false, message: 'Title is required.' };
    }

    if (!publication.type) {
        return { valid: false, message: 'Publication type is required.' };
    }

    return { valid: true };
};

/* =======================
   Sanitization
======================= */
export const sanitizePublication = (
    publication: Partial<Publication>
): Partial<Publication> => {
    return {
        ...publication,
        author:
            typeof publication.author === 'object' && publication.author !== null
                ? (publication.author as any)._id
                : publication.author,
    };
};

/* =======================
   Query Options
======================= */
export interface GetPublicationsOptions {
    author?: string | User;
    type?: PublicationType;
}
