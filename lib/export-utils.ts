/**
 * Utility functions for exporting data in various formats
 */

/**
 * Export data to CSV format
 */
export function exportToCSV(data: Array<Record<string, any>>, filename: string) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csv = [
    headers.map(h => `"${h}"`).join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  // Create and download blob
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data as HTML and open print dialog (can be saved as PDF)
 */
export function exportToHTML(htmlContent: string, title: string = 'Report') {
  const printWindow = window.open();
  if (!printWindow) {
    alert('Please allow pop-ups to export document');
    return;
  }

  const styledHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          padding: 20px;
        }
        h1 {
          color: #1e40af;
          margin-bottom: 20px;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 10px;
        }
        h2 {
          color: #1e40af;
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 1.2em;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #f0f4f8;
          color: #1e40af;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #ddd;
        }
        td {
          padding: 10px 12px;
          border: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .summary {
          background-color: #f0f4f8;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .summary-item {
          display: inline-block;
          margin-right: 30px;
          margin-bottom: 10px;
        }
        .summary-label {
          font-weight: 600;
          color: #666;
          font-size: 0.9em;
        }
        .summary-value {
          font-size: 1.3em;
          color: #1e40af;
          margin-top: 5px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 0.9em;
          text-align: center;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Hospital Management System - HealthHub</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(styledHTML);
  printWindow.document.close();
  
  // Automatically open print dialog
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Generate a report title with timestamp
 */
export function getReportTitle(baseTitle: string): string {
  const date = new Date();
  return `${baseTitle} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

/**
 * Format currency for reports
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
