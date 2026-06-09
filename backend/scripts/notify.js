const nodemailer = require('nodemailer');

async function sendNotification() {
  const {
    NOTIFY_EMAIL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    PIPELINE_STATUS,
    DEPLOY_STATUS,
    GITHUB_REPOSITORY,
    GITHUB_RUN_ID,
    GITHUB_REF_NAME,
    GITHUB_ACTOR,
  } = process.env;

  const isSuccess = PIPELINE_STATUS === 'success';
  const statusEmoji = isSuccess ? '✅' : '❌';
  const statusText = isSuccess ? 'SUCESSO' : 'FALHA';
  const runUrl = `https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;

  if (!NOTIFY_EMAIL || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('⚠️  Variáveis SMTP não configuradas — exibindo resultado no console:\n');
    console.log(`${statusEmoji} Pipeline: ${statusText}`);
    console.log(`   Repositório : ${GITHUB_REPOSITORY}`);
    console.log(`   Branch      : ${GITHUB_REF_NAME}`);
    console.log(`   Autor       : ${GITHUB_ACTOR}`);
    console.log(`   Deploy      : ${DEPLOY_STATUS || 'N/A'}`);
    console.log(`   Detalhes    : ${runUrl}`);
    return;
  }

  const port = parseInt(SMTP_PORT || '587', 10);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: ${isSuccess ? '#22c55e' : '#ef4444'}">
        ${statusEmoji} Pipeline CI/CD — ${statusText}
      </h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding:6px;"><strong>Repositório</strong></td><td style="padding:6px;">${GITHUB_REPOSITORY}</td></tr>
        <tr><td style="padding:6px;"><strong>Branch</strong></td><td style="padding:6px;">${GITHUB_REF_NAME}</td></tr>
        <tr><td style="padding:6px;"><strong>Autor</strong></td><td style="padding:6px;">${GITHUB_ACTOR}</td></tr>
        <tr><td style="padding:6px;"><strong>Build / Testes</strong></td><td style="padding:6px;">${PIPELINE_STATUS}</td></tr>
        <tr><td style="padding:6px;"><strong>Deploy</strong></td><td style="padding:6px;">${DEPLOY_STATUS || 'N/A'}</td></tr>
      </table>
      <p style="margin-top: 16px;">
        <a href="${runUrl}" style="background: #2563eb; color: #fff; padding: 8px 16px; border-radius: 4px; text-decoration: none;">
          Ver detalhes no GitHub Actions
        </a>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: SMTP_USER,
    to: NOTIFY_EMAIL,
    subject: `${statusEmoji} [CI/CD] ${GITHUB_REPOSITORY} — ${statusText} (${GITHUB_REF_NAME})`,
    html,
  });

  console.log(`✅ Notificação enviada para ${NOTIFY_EMAIL}`);
}

sendNotification().catch((err) => {
  console.error('❌ Falha ao enviar notificação:', err.message);
  process.exit(1);
}); 


