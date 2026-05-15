
function dailyDigestTemplate({ date, activity }) {
  const { uploaded = 0, downloaded = 0, deleted = 0, restored = 0, totalBytesUploaded = 0 } = activity

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const totalActions = uploaded + downloaded + deleted + restored

  const statRow = (emoji, label, count, color) =>
    count > 0
      ? `<tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:20px;width:36px;">${emoji}</td>
                <td style="font-size:14px;color:#374151;font-weight:500;">${label}</td>
                <td align="right" style="font-size:16px;font-weight:700;color:${color};">${count} file${count !== 1 ? "s" : ""}</td>
              </tr>
            </table>
          </td>
        </tr>`
      : ""

  return {
    subject: `📊 Your CloudStore Daily Activity — ${formattedDate}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Daily Digest</title>
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
                    <span style="font-size:12px;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">Daily Activity Digest</span>
                  </td>
                  <td align="right">
                    <span style="font-size:36px;">📊</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">
              <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0f172a;">Yesterday's Activity</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;">${formattedDate}</p>

              <!-- Total Badge -->
              <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:10px;padding:20px 24px;margin-bottom:28px;text-align:center;">
                <div style="font-size:13px;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Total Actions</div>
                <div style="font-size:40px;font-weight:800;color:#1d4ed8;">${totalActions}</div>
                ${totalBytesUploaded > 0 ? `<div style="font-size:13px;color:#64748b;margin-top:4px;">${formatBytes(totalBytesUploaded)} uploaded</div>` : ""}
              </div>

              <!-- Activity Breakdown -->
              <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:1px;">Breakdown</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
                <tbody>
                  ${statRow("📤", "Uploaded", uploaded, "#16a34a")}
                  ${statRow("📥", "Downloaded", downloaded, "#2563eb")}
                  ${statRow("🗑️", "Deleted", deleted, "#dc2626")}
                  ${statRow("♻️", "Restored", restored, "#d97706")}
                  ${totalActions === 0 ? `<tr><td style="padding:24px;text-align:center;color:#9ca3af;font-size:14px;">No activity recorded for this period.</td></tr>` : ""}
                </tbody>
              </table>

              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
                View your full storage dashboard at <a href="#" style="color:#3b82f6;text-decoration:none;">cloudstore.com/dashboard</a>.
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
                To disable daily digests, update your <a href="#" style="color:#3b82f6;text-decoration:none;">notification preferences</a>.
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

module.exports = dailyDigestTemplate