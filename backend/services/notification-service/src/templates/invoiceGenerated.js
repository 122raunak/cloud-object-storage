
function invoiceGeneratedTemplate({ invoiceId, periodStart, periodEnd, totalAmount, currency, lineItems = [] }) {
  const formattedStart = new Date(periodStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  const formattedEnd = new Date(periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  const lineItemsHtml = lineItems.length
    ? lineItems
        .map(
          (item) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#374151;font-size:14px;">${item.description}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#374151;font-size:14px;text-align:right;">${currency} ${parseFloat(item.amount).toFixed(4)}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="2" style="padding:12px 16px;color:#9ca3af;font-size:14px;text-align:center;">No itemized charges available.</td></tr>`

  return {
    subject: `Invoice #${invoiceId} — ${formattedStart} to ${formattedEnd}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Invoice Generated</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;border-radius:12px 12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">☁ CloudStore</span>
                    <br/>
                    <span style="font-size:12px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">Object Storage Platform</span>
                  </td>
                  <td align="right">
                    <span style="background:#3b82f6;color:#ffffff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;">Invoice</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Your invoice is ready</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
                Your invoice for the billing period <strong style="color:#0f172a;">${formattedStart}</strong> to <strong style="color:#0f172a;">${formattedEnd}</strong> has been generated.
              </p>

              <!-- Invoice Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Invoice ID</td>
                        <td align="right" style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Billing Period</td>
                      </tr>
                      <tr>
                        <td style="font-size:18px;font-weight:700;color:#0f172a;padding-top:4px;">#${invoiceId}</td>
                        <td align="right" style="font-size:14px;color:#374151;padding-top:4px;">${formattedStart} – ${formattedEnd}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Line Items -->
              <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:1px;">Charges Breakdown</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:28px;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Description</th>
                    <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsHtml}
                </tbody>
                <tfoot>
                  <tr style="background:#0f172a;">
                    <td style="padding:16px;font-size:15px;font-weight:700;color:#ffffff;">Total Due</td>
                    <td style="padding:16px;font-size:18px;font-weight:800;color:#60a5fa;text-align:right;">${currency} ${parseFloat(totalAmount).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              <!-- Auto-debit Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:14px;color:#1d4ed8;line-height:1.5;">
                      <strong>💳 Payment Notice:</strong> The amount of <strong>${currency} ${parseFloat(totalAmount).toFixed(2)}</strong> will be automatically debited from your registered payment method within 3–5 business days.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
                Questions about this invoice? Contact our billing team at <a href="mailto:billing@cloudstore.com" style="color:#3b82f6;text-decoration:none;">billing@cloudstore.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9;padding:24px 40px;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} CloudStore, Inc. · <a href="#" style="color:#94a3b8;text-decoration:none;">Privacy Policy</a> · <a href="#" style="color:#94a3b8;text-decoration:none;">Terms of Service</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                To manage your notification preferences, visit your <a href="#" style="color:#3b82f6;text-decoration:none;">account settings</a>. This is an automated email — please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  }
}

module.exports = invoiceGeneratedTemplate