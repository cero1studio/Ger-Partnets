export const getInvitationEmail = (nombre: string, email: string, inviteLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #e2e8f0; border-radius: 24px; }
    .logo { height: 60px; margin-bottom: 32px; }
    .header { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 16px; letter-spacing: -0.025em; }
    .content { font-size: 16px; margin-bottom: 32px; color: #475569; }
    .button { background-color: #2563eb; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
    .footer { font-size: 12px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #f1f5f9; pt: 24px; }
    .badge { display: inline-block; padding: 4px 12px; background: #eff6ff; color: #2563eb; border-radius: 100px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <img src="https://gerpartners.com/logo.png" alt="Global Express" class="logo">
    <div class="badge">INVITACIÓN EXCLUSIVA</div>
    <h1 class="header">¡Hola, ${nombre}! 👋</h1>
    <p class="content">
      Has sido invitado a unirte a la red de <strong>Aliados Estratégicos de Global Express</strong>.
      <br><br>
      En esta plataforma podrás gestionar tus propios referidos, seguir su progreso en tiempo real y generar ingresos significativos mientras ayudas a otros a cumplir su proyecto de vida en los Estados Unidos.
    </p>
    <a href="${inviteLink}" class="button">Aceptar Invitación y Registrarse</a>
    <p class="content" style="margin-top: 32px; font-size: 14px;">
      Este enlace es personal y exclusivo para tu correo: <strong>${email}</strong>.
    </p>
    <div class="footer">
      © 2026 Global Express Recruiting. Todos los derechos reservados.<br>
      Este es un correo automático, por favor no respondas a esta dirección.
    </div>
  </div>
</body>
</html>
`

export const getResetPasswordEmail = (nombre: string, resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #e2e8f0; border-radius: 24px; }
    .logo { height: 60px; margin-bottom: 32px; }
    .header { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 16px; letter-spacing: -0.025em; }
    .content { font-size: 16px; margin-bottom: 32px; color: #475569; }
    .button { background-color: #0f172a; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 16px; }
    .footer { font-size: 12px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #f1f5f9; pt: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <img src="https://gerpartners.com/logo.png" alt="Global Express" class="logo">
    <h1 class="header">Restablecer Contraseña</h1>
    <p class="content">
      Hola, ${nombre}. Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Portal de Aliados.
      <br><br>
      Haz clic en el botón de abajo para elegir una nueva contraseña:
    </p>
    <a href="${resetLink}" class="button">Restablecer Contraseña</a>
    <p class="content" style="margin-top: 32px; font-size: 14px;">
      Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
    </p>
    <div class="footer">
      © 2026 Global Express Recruiting. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>
`
