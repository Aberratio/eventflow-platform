import { Registration, Result } from '@/types';

// CSV Export Utility
export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(';'),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values with commas, quotes, or newlines
        if (typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(';')
    )
  ].join('\n');

  // Add BOM for proper Polish characters in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Prepare participant data for export
export const prepareParticipantsExport = (registrations: Registration[]) => {
  return registrations.map((reg, index) => ({
    'Lp.': index + 1,
    'Numer startowy': reg.bibNumber || '-',
    'Imię i nazwisko': reg.userName,
    'Email': reg.userEmail,
    'Dystans': reg.distanceName,
    'Kategoria': reg.category,
    'Drużyna': reg.teamName || '-',
    'Status': getStatusLabel(reg.status),
    'Data zapisu': new Date(reg.registeredAt).toLocaleDateString('pl-PL'),
    'Kwota': reg.pricePaid ? `${reg.pricePaid} PLN` : '-',
  }));
};

// Prepare results data for export
export const prepareResultsExport = (results: Result[]) => {
  return results.map(result => ({
    'Pozycja': result.position,
    'Numer startowy': result.bibNumber,
    'Imię i nazwisko': result.userName,
    'Czas': result.time,
    'Kategoria': result.category,
    'Pozycja w kategorii': result.categoryPosition,
    'Status': getResultStatusLabel(result.status),
  }));
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Oczekujący',
    confirmed: 'Potwierdzony',
    cancelled: 'Anulowany',
    removed: 'Usunięty',
  };
  return labels[status] || status;
};

const getResultStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    finished: 'Ukończył',
    dnf: 'DNF',
    dsq: 'DSQ',
  };
  return labels[status] || status;
};

// Print as PDF (using browser print)
export const printToPDF = (title: string, content: HTMLElement | string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = typeof content === 'string' ? content : content.outerHTML;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          padding: 20px;
          color: #1a1a1a;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 10px;
        }
        h2 {
          font-size: 18px;
          color: #666;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: #fafafa;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${title}</h1>
          <h2>Wygenerowano: ${new Date().toLocaleDateString('pl-PL', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</h2>
        </div>
      </div>
      ${htmlContent}
      <div class="footer">
        SportTime - Platforma wydarzeń sportowych
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  
  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

// Generate HTML table from data
export const generateHTMLTable = (data: Record<string, unknown>[]): string => {
  if (data.length === 0) return '<p>Brak danych</p>';

  const headers = Object.keys(data[0]);
  
  return `
    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            ${headers.map(h => `<td>${row[h] ?? '-'}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};
