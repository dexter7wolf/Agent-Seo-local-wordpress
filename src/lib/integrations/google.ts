import { google } from "googleapis";

export const getGoogleAuth = () => {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    return auth;
};

export const getGoogleDocsClient = (auth: any) => {
    return google.docs({ version: "v1", auth });
};

export const getGoogleSheetsClient = (auth: any) => {
    return google.sheets({ version: "v4", auth });
};

/**
 * Fetches content from a Google Doc and returns it as a structured object.
 */
export const fetchDocContent = async (docId: string, auth: any) => {
    const docs = getGoogleDocsClient(auth);
    const res = await docs.documents.get({ documentId: docId });
    return res.data;
};

/**
 * Fetches SEO metadata from a Google Sheet based on an article slug.
 */
export const fetchSheetMetadata = async (sheetId: string, range: string, auth: any) => {
    const sheets = getGoogleSheetsClient(auth);
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
    });
    return res.data.values;
};
