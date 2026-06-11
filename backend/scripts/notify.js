const nodemailer = require('nodemailer');

async function sendNotification() {
  const { NOTIFY_EMAIL, SMTP_USER, SMTP_PASS, PIPELINE_STATUS, JOB_NAME, BUILD_NUMBER } = process.env;

  const isSuccess = PIPELINE_STATUS === 'success';

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_USER,
    to: NOTIFY_EMAIL,
    subject: `${isSuccess ? '✅' : '❌'} ${JOB_NAME} #${BUILD_NUMBER} — ${isSuccess ? 'Sucesso' : 'Falha'}`,
    text: `O pipeline ${JOB_NAME} build #${BUILD_NUMBER} finalizou com status: ${isSuccess ? 'SUCESSO' : 'FALHA'}.`,
  });

  console.log(`Notificação enviada para ${NOTIFY_EMAIL}`);
}

sendNotification().catch((err) => {
  console.error('Falha ao enviar notificação:', err.message);
  process.exit(1);
});