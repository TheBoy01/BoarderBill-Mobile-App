import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const generateElectricBillPdf = async (bill, entries, meralcoCharge) => {
  const rows = entries
    .map((item) => {
      const consumed = item.new_kwh - item.started_kwh;
      return `
        <tr>
          <td>${item.name}</td>
          <td>${item.started_kwh}</td>
          <td>${item.new_kwh}</td>
          <td>${consumed.toFixed(2)}</td>
          <td>₱${item.total_due.toFixed(2)}</td>
          <td>${item.is_paid ? 'Paid' : 'Unpaid'}</td>
        </tr>`;
    })
    .join('');

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
          h1 { font-size: 24px; color: #2563EB; margin-bottom: 4px; }
          h3 { font-size: 14px; color: #6B7280; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th { background: #2563EB; color: white; padding: 10px; text-align: left; font-size: 13px; }
          td { padding: 10px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
          tr:nth-child(even) { background: #F9FAFB; }
          .footer { margin-top: 40px; font-size: 12px; color: #9CA3AF; text-align: center; }
          .badge-paid { color: #16A34A; font-weight: bold; }
          .badge-unpaid { color: #DC2626; font-weight: bold; }
          .info { margin-top: 16px; font-size: 13px; color: #374151; }
        </style>
      </head>
      <body>
        <h1>BoardMate Bill</h1>
        <h3>Electric Bill — ${bill.month}</h3>
        <div class="info">
          <strong>Meralco Charge:</strong> ₱${meralcoCharge}/kWh &nbsp;&nbsp;
          <strong>Generated:</strong> ${new Date().toLocaleDateString()}
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Prev kWh</th>
              <th>New kWh</th>
              <th>Consumed</th>
              <th>Total Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">BoardMate Bill — Generated on ${new Date().toLocaleString()}</div>
      </body>
    </html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Electric Bill PDF',
  });
};

export const generateWaterBillPdf = async (bill, entries) => {
  const rows = entries
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>₱${bill.total_amount.toFixed(2)}</td>
        <td>₱${item.amount.toFixed(2)}</td>
        <td>${item.is_paid ? 'Paid' : 'Unpaid'}</td>
      </tr>`
    )
    .join('');

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
          h1 { font-size: 24px; color: #0EA5E9; margin-bottom: 4px; }
          h3 { font-size: 14px; color: #6B7280; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th { background: #0EA5E9; color: white; padding: 10px; text-align: left; font-size: 13px; }
          td { padding: 10px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
          tr:nth-child(even) { background: #F9FAFB; }
          .footer { margin-top: 40px; font-size: 12px; color: #9CA3AF; text-align: center; }
          .info { margin-top: 16px; font-size: 13px; color: #374151; }
        </style>
      </head>
      <body>
        <h1>BoardMate Bill</h1>
        <h3>Water Bill — ${bill.month}</h3>
        <div class="info">
          <strong>Total Bill:</strong> ₱${bill.total_amount.toFixed(2)} &nbsp;&nbsp;
          <strong>Per Person:</strong> ₱${bill.per_person.toFixed(2)} &nbsp;&nbsp;
          <strong>Generated:</strong> ${new Date().toLocaleDateString()}
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Total Bill</th>
              <th>Share</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">BoardMate Bill — Generated on ${new Date().toLocaleString()}</div>
      </body>
    </html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Water Bill PDF',
  });
};

export const generateRentBillPdf = async (month, entries) => {
  const rows = entries
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>₱${item.amount.toFixed(2)}</td>
        <td>${item.is_paid ? 'Paid' : 'Unpaid'}</td>
      </tr>`
    )
    .join('');

  const total = entries.reduce((sum, item) => sum + item.amount, 0);

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
          h1 { font-size: 24px; color: #7C3AED; margin-bottom: 4px; }
          h3 { font-size: 14px; color: #6B7280; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th { background: #7C3AED; color: white; padding: 10px; text-align: left; font-size: 13px; }
          td { padding: 10px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
          tr:nth-child(even) { background: #F9FAFB; }
          .footer { margin-top: 40px; font-size: 12px; color: #9CA3AF; text-align: center; }
          .info { margin-top: 16px; font-size: 13px; color: #374151; }
        </style>
      </head>
      <body>
        <h1>BoardMate Bill</h1>
        <h3>Rent Bill — ${month}</h3>
        <div class="info">
          <strong>Total Collection:</strong> ₱${total.toFixed(2)} &nbsp;&nbsp;
          <strong>Generated:</strong> ${new Date().toLocaleDateString()}
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">BoardMate Bill — Generated on ${new Date().toLocaleString()}</div>
      </body>
    </html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Rent Bill PDF',
  });
};
