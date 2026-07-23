export interface XlsxSheetSpec {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

export async function downloadXlsx(filename: string, sheets: XlsxSheetSpec[]): Promise<void> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();

  sheets.forEach(({ name, headers, rows }) => {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };
    rows.forEach(r => sheet.addRow(r));
    sheet.columns.forEach(col => { col.width = 20; });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
