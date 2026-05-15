
function budgetAlertTemplate({ invoiceId, totalAmount, currency, threshold, periodStart, periodEnd }) {
  const formattedStart = new Date(periodStart).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  const formattedEnd = new Date(periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  const overage = (parseFloat(totalAmount) - parseFloat(threshold)).toFixed(2)

  return {
    subject: `⚠️ Budget Alert: You've exceeded your ${currency} ${parseFloat(threshold).toFixed(2)} limit`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Budget Alert</title>
</head>
<body style="margin:0;padding:0;background:#fef2f2;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%);padding:32px 40px;border-radius:12px 12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">☁ CloudStore</span>
                    <br/>
                    <span style="font-size:12px;color:#fca5a5;letter-spacing:2px;text-transform:uppercase;">Object Storage Platform</span>
                  </td>
                  <td align="right">
                    <span style="background:rgba(255,255,255,0.2);color:#ffffff;font-size:22px;padding:8px 12px;border-radius:8px;">⚠️</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#7f1d1d;">Budget Limit Exceeded</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
                Your CloudStore usage for the period <strong style="color:#0f172a;">${formattedStart}</strong> to <strong style="color:#0f172a;">${formattedEnd}</strong> has exceeded your configured budget threshold.
              </p>

              <!-- Alert Stats -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="width:33%;padding:0 8px 0 0;">
                    <div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:10px;padding:20px;text-align:center;">
                      <div style="font-size:11px;color:#ef4444;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Your Budget</div>
                      <div style="font-size:20px;font-weight:800;color:#7f1d1d;">${currency} ${parseFloat(threshold).toFixed(2)}</div>
                    </div>
                  </td>
                  <td style="width:33%;padding:0 4px;">
                    <div style="background:#fff7ed;border:2px solid #fb923c;border-radius:10px;padding:20px;text-align:center;">
                      <div style="font-size:11px;color:#f97316;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Actual Spend</div>
                      <div style="font-size:20px;font-weight:800;color:#c2410c;">${currency} ${parseFloat(totalAmount).toFixed(2)}</div>
                    </div>
                  </td>
                  <td style="width:33%;padding:0 0 0 8px;">
                    <div style="background:#fef2f2;border:2px solid #f87171;border-radius:10px;padding:20px;text-align:center;">
                      <div style="font-size:11px;color:#ef4444;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Overage</div>
                      <div style="font-size:20px;font-weight:800;color:#dc2626;">+${currency} ${overage}</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Invoice Reference -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:14px;color:#374151;">
                      Referenced Invoice: <strong style="color:#0f172a;">#${invoiceId}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Recommendations -->
              <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;">Recommended Actions</h3>
              <ul style="margin:0 0 24px;padding:0 0 0 20px;color:#64748b;font-size:14px;line-height:1.8;">
                <li>Review your storage usage and delete unused files</li>
                <li>Adjust your budget threshold in <a href="#" style="color:#3b82f6;text-decoration:none;">notification preferences</a></li>
                <li>Consider upgrading your plan for better pricing</li>
              </ul>

              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
                Need help managing costs? Contact <a href="mailto:support@cloudstore.com" style="color:#3b82f6;text-decoration:none;">support@cloudstore.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fef2f2;padding:24px 40px;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} CloudStore, Inc. · <a href="#" style="color:#94a3b8;text-decoration:none;">Privacy Policy</a> · <a href="#" style="color:#94a3b8;text-decoration:none;">Terms of Service</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                To update your budget threshold, visit your <a href="#" style="color:#ef4444;text-decoration:none;">account settings</a>. This is an automated alert.
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

module.exports = budgetAlertTemplate