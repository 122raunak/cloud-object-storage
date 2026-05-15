
function loginAlertTemplate({ timestamp, ipAddress, userAgent = "Unknown" }) {
  const formattedTime = new Date(timestamp).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })

  return {
    subject: `🔐 New Login Detected on Your CloudStore Account`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Login Alert</title>
</head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#0369a1 100%);padding:32px 40px;border-radius:12px 12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">☁ CloudStore</span>
                    <br/>
                    <span style="font-size:12px;color:#7dd3fc;letter-spacing:2px;text-transform:uppercase;">Security Alert</span>
                  </td>
                  <td align="right">
                    <span style="font-size:36px;">🔐</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">New Login Detected</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
                We noticed a new sign-in to your CloudStore account. If this was you, no action is needed. If you don't recognize this activity, secure your account immediately.
              </p>

              <!-- Login Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;overflow:hidden;">
                <tr>
                  <td style="padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;width:100px;">Time</td>
                              <td style="font-size:14px;color:#0f172a;font-weight:500;">${formattedTime}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;width:100px;">IP Address</td>
                              <td style="font-size:14px;color:#0f172a;font-weight:500;font-family:monospace;">${ipAddress}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:16px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;width:100px;">Device</td>
                              <td style="font-size:13px;color:#64748b;">${userAgent.substring(0, 80)}${userAgent.length > 80 ? "..." : ""}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Was this you? -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="width:50%;padding:0 8px 0 0;">
                    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;text-align:center;">
                      <div style="font-size:20px;margin-bottom:8px;">✅</div>
                      <div style="font-size:13px;font-weight:600;color:#15803d;margin-bottom:4px;">This was me</div>
                      <div style="font-size:12px;color:#64748b;">No action needed</div>
                    </div>
                  </td>
                  <td style="width:50%;padding:0 0 0 8px;">
                    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;text-align:center;">
                      <div style="font-size:20px;margin-bottom:8px;">🚨</div>
                      <div style="font-size:13px;font-weight:600;color:#dc2626;margin-bottom:4px;">This wasn't me</div>
                      <div style="font-size:12px;color:#64748b;"><a href="#" style="color:#dc2626;text-decoration:underline;">Secure my account</a></div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
                To review your login history or enable two-factor authentication, visit your <a href="#" style="color:#3b82f6;text-decoration:none;">security settings</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0f9ff;padding:24px 40px;border-radius:0 0 12px 12px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} CloudStore, Inc. · <a href="#" style="color:#94a3b8;text-decoration:none;">Privacy Policy</a> · <a href="#" style="color:#94a3b8;text-decoration:none;">Terms of Service</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                To manage login alerts, visit your <a href="#" style="color:#3b82f6;text-decoration:none;">notification preferences</a>.
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

module.exports = loginAlertTemplate