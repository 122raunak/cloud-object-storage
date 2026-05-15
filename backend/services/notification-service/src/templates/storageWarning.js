
function storageWarningTemplate({ usedGB, quotaGB, percentUsed, threshold }) {
  const isCritical = threshold >= 95
  const accentColor = isCritical ? "#dc2626" : "#f59e0b"
  const bgColor = isCritical ? "#fef2f2" : "#fffbeb"
  const headerGradient = isCritical
    ? "linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%)"
    : "linear-gradient(135deg,#78350f 0%,#f59e0b 100%)"
  const freeGB = Math.max(0, quotaGB - usedGB).toFixed(2)
  const barPercent = Math.min(percentUsed, 100)

  return {
    subject: isCritical
      ? `🔴 Critical: Storage at ${threshold}% — Immediate Action Required`
      : `🟡 Warning: Storage Usage at ${threshold}% of Your Quota`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Storage Warning</title>
</head>
<body style="margin:0;padding:0;background:${bgColor};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${bgColor};padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${headerGradient};padding:32px 40px;border-radius:12px 12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">☁ CloudStore</span>
                    <br/>
                    <span style="font-size:12px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">Storage Alert</span>
                  </td>
                  <td align="right">
                    <span style="font-size:36px;">${isCritical ? "🔴" : "🟡"}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
                ${isCritical ? "Critical Storage Alert" : "Storage Warning"}
              </h2>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
                You have used <strong style="color:${accentColor};">${percentUsed.toFixed(1)}%</strong> of your storage quota. 
                ${isCritical ? "Uploads will be blocked when you reach 100%." : "Consider cleaning up unused files."}
              </p>

              <!-- Progress Bar -->
              <div style="margin-bottom:28px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                  <tr>
                    <td style="font-size:13px;color:#374151;font-weight:600;">Storage Used</td>
                    <td align="right" style="font-size:13px;color:${accentColor};font-weight:700;">${percentUsed.toFixed(1)}%</td>
                  </tr>
                </table>
                <div style="background:#e2e8f0;border-radius:99px;height:12px;overflow:hidden;">
                  <div style="background:${accentColor};height:100%;width:${barPercent}%;border-radius:99px;"></div>
                </div>
              </div>

              <!-- Stats Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="width:33%;padding:0 8px 0 0;">
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;text-align:center;">
                      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Total Quota</div>
                      <div style="font-size:20px;font-weight:800;color:#0f172a;">${quotaGB} GB</div>
                    </div>
                  </td>
                  <td style="width:33%;padding:0 4px;">
                    <div style="background:#f8fafc;border:2px solid ${accentColor};border-radius:10px;padding:20px;text-align:center;">
                      <div style="font-size:11px;color:${accentColor};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Used</div>
                      <div style="font-size:20px;font-weight:800;color:${accentColor};">${usedGB} GB</div>
                    </div>
                  </td>
                  <td style="width:33%;padding:0 0 0 8px;">
                    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px;text-align:center;">
                      <div style="font-size:11px;color:#16a34a;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Available</div>
                      <div style="font-size:20px;font-weight:800;color:#15803d;">${freeGB} GB</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Actions -->
              <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;">Free Up Space</h3>
              <ul style="margin:0 0 24px;padding:0 0 0 20px;color:#64748b;font-size:14px;line-height:1.8;">
                <li>Delete files you no longer need from your storage buckets</li>
                <li>Enable lifecycle policies to auto-expire old objects</li>
                <li>Upgrade your storage quota in <a href="#" style="color:#3b82f6;text-decoration:none;">account settings</a></li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} CloudStore, Inc. · <a href="#" style="color:#94a3b8;text-decoration:none;">Privacy Policy</a> · <a href="#" style="color:#94a3b8;text-decoration:none;">Terms of Service</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                To manage storage alerts, visit your <a href="#" style="color:#3b82f6;text-decoration:none;">notification preferences</a>.
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

module.exports = storageWarningTemplate