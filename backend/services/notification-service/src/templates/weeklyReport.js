
function weeklyReportTemplate({ weekStart, weekEnd, usedGB, quotaGB, activity }) {
  const { uploaded = 0, downloaded = 0, deleted = 0, restored = 0, totalBytesUploaded = 0 } = activity

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const usedPercent = Math.min(((usedGB / quotaGB) * 100).toFixed(1), 100)
  const freeGB = Math.max(0, quotaGB - usedGB).toFixed(2)
  const barColor = usedPercent >= 95 ? "#dc2626" : usedPercent >= 80 ? "#f59e0b" : "#22c55e"

  return {
    subject: `📈 Weekly Storage Report — ${fmtDate(weekStart)} to ${fmtDate(weekEnd)}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Weekly Storage Report</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#312e81 100%);padding:32px 40px;border-radius:12px 12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">☁ CloudStore</span>
                    <br/>
                    <span style="font-size:12px;color:#a5b4fc;letter-spacing:2px;text-transform:uppercase;">Weekly Storage Report</span>
                  </td>
                  <td align="right">
                    <span style="font-size:36px;">📈</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">
              <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0f172a;">Your Weekly Summary</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;">${fmtDate(weekStart)} — ${fmtDate(weekEnd)}</p>

              <!-- Storage Usage -->
              <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:1px;">Storage Usage</h3>

              <div style="margin-bottom:8px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:14px;color:#374151;">${usedGB} GB used of ${quotaGB} GB</td>
                    <td align="right" style="font-size:14px;font-weight:700;color:${barColor};">${usedPercent}%</td>
                  </tr>
                </table>
              </div>
              <div style="background:#e2e8f0;border-radius:99px;height:10px;overflow:hidden;margin-bottom:20px;">
                <div style="background:${barColor};height:100%;width:${usedPercent}%;border-radius:99px;"></div>
              </div>

              <!-- Storage Stats -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="width:50%;padding:0 8px 0 0;">
                    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:11px;color:#16a34a;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Free Space</div>
                      <div style="font-size:22px;font-weight:800;color:#15803d;">${freeGB} GB</div>
                    </div>
                  </td>
                  <td style="width:50%;padding:0 0 0 8px;">
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;">
                      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Total Quota</div>
                      <div style="font-size:22px;font-weight:800;color:#0f172a;">${quotaGB} GB</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Weekly Activity -->
              <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:1px;">Weekly File Activity</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Action</th>
                    <th style="padding:12px 16px;text-align:right;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#374151;">📤 Files Uploaded</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:#16a34a;text-align:right;">${uploaded}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#374151;">📥 Files Downloaded</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:#2563eb;text-align:right;">${downloaded}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#374151;">🗑️ Files Deleted</td>
                    <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:700;color:#dc2626;text-align:right;">${deleted}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px;font-size:14px;color:#374151;">♻️ Files Restored</td>
                    <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#d97706;text-align:right;">${restored}</td>
                  </tr>
                </tbody>
                ${totalBytesUploaded > 0 ? `
                <tfoot>
                  <tr style="background:#f8fafc;">
                    <td style="padding:12px 16px;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;">Total Data Uploaded</td>
                    <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#374151;text-align:right;border-top:1px solid #e2e8f0;">${formatBytes(totalBytesUploaded)}</td>
                  </tr>
                </tfoot>` : ""}
              </table>

              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
                View your full storage analytics at <a href="#" style="color:#3b82f6;text-decoration:none;">cloudstore.com/dashboard</a>.
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
                To disable weekly reports, update your <a href="#" style="color:#3b82f6;text-decoration:none;">notification preferences</a>.
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

module.exports = weeklyReportTemplate