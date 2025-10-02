const SHEET_JS_URL = "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

export type SheetjsModule = {
  read: (data: ArrayBuffer | string, opts: Record<string, unknown>) => any;
  utils: {
    sheet_to_json: (sheet: any, opts?: Record<string, unknown>) => any[];
    json_to_sheet: (data: any[], opts?: Record<string, unknown>) => any;
    book_new: () => any;
    book_append_sheet: (workbook: any, worksheet: any, name?: string) => void;
  };
  writeFile: (workbook: any, filename: string, opts?: Record<string, unknown>) => void;
};

let cachedModule: Promise<SheetjsModule> | null = null;

export async function ensureSheetJs(): Promise<SheetjsModule> {
  if (!cachedModule) {
    cachedModule = import(/* @vite-ignore */ SHEET_JS_URL).then((mod) => mod as SheetjsModule);
  }
  return cachedModule;
}
