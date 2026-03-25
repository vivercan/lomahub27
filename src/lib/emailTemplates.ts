// ── Email Templates — LomaHUB27 ──
// Premium onboarding and notification emails
// Used by Edge Functions (Resend integration)

export interface EmailTemplateParams {
  razonSocial: string
  contactoNombre: string
  ejecutivoNombre: string
  ejecutivoEmail: string
  ejecutivoTelefono?: string
  portalUrl?: string
}

export function altaComercialEmail(params: EmailTemplateParams): string {
  const { razonSocial, contactoNombre, ejecutivoNombre, ejecutivoEmail, ejecutivoTelefono, portalUrl } = params

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a TROB</title>
</head>
<body style="margin:0;padding:0;background:#16161E;font-family:'Montserrat',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#16161E;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#1E1E2A;border-radius:16px;border:1px solid #2A2A36;box-shadow:0 8px 32px rgba(0,0,0,0.25);">
          
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #2A2A36;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:800;color:#E8E8ED;letter-spacing:-0.5px;">LomaHUB27</span>
                    <span style="font-size:11px;color:#5C5C6B;margin-left:8px;text-transform:uppercase;letter-spacing:1px;">TROB Logistics</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome -->
          <tr>
            <td style="padding:28px 32px 8px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#E8E8ED;line-height:1.3;">
                Bienvenido, ${contactoNombre}
              </h1>
              <p style="margin:0;font-size:14px;color:#8B8B9A;line-height:1.6;">
                Es un gusto confirmarle que <strong style="color:#E8E8ED;">${razonSocial}</strong> ha sido registrada exitosamente en nuestro sistema comercial.
              </p>
            </td>
          </tr>

          <!-- What's Next -->
          <tr>
            <td style="padding:20px 32px;">
              <table role="presentation" width="100%" style="background:#272733;border-radius:12px;border:1px solid #2A2A36;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#E8E8ED;text-transform:uppercase;letter-spacing:0.5px;">
                      Siguientes pasos
                    </p>
                    <table role="presentation" width="100%">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#8B8B9A;line-height:1.5;">
                          <span style="color:#3B6CE7;font-weight:700;margin-right:8px;">1.</span> Documentacion fiscal y operativa
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#8B8B9A;line-height:1.5;">
                          <span style="color:#3B6CE7;font-weight:700;margin-right:8px;">2.</span> Revision y validacion por el equipo comercial
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#8B8B9A;line-height:1.5;">
                          <span style="color:#3B6CE7;font-weight:700;margin-right:8px;">3.</span> Activacion de cuenta y asignacion de ejecutivo
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${portalUrl ? `
          <!-- Upload Button -->
          <tr>
            <td align="center" style="padding:8px 32px 20px;">
              <a href="${portalUrl}" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:700;color:#fff;background:#3B6CE7;border-radius:8px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(59,108,231,0.2);">
                Subir Documentacion
              </a>
            </td>
          </tr>
          ` : ''}

          <!-- Contact Card -->
          <tr>
            <td style="padding:8px 32px 24px;">
              <table role="presentation" width="100%" style="background:#272733;border-radius:12px;border:1px solid #2A2A36;">
                <tr>
                  <td style="padding:16px 24px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#5C5C6B;text-transform:uppercase;letter-spacing:1px;">
                      Su ejecutivo comercial
                    </p>
                    <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#E8E8ED;">
                      ${ejecutivoNombre}
                    </p>
                    <p style="margin:0;font-size:13px;color:#8B8B9A;">
                      <a href="mailto:${ejecutivoEmail}" style="color:#3B6CE7;text-decoration:none;">${ejecutivoEmail}</a>
                      ${ejecutivoTelefono ? ` &middot; ${ejecutivoTelefono}` : ''}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #2A2A36;">
              <p style="margin:0;font-size:11px;color:#5C5C6B;text-align:center;">
                TROB Logistics &middot; Transporte de carga nacional e internacional
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
