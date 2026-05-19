export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (value: string) => {
    const normalized = value.replace(/"/g, '""');
    return `"${normalized}"`;
  };

  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map((cell) => escape(cell ?? "")).join(",")),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
