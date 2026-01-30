const { Resend } = require('resend');

function escapeHtml(s) {
    if (s == null || s === '') return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

let resend = null;
function getResendClient() {
    if (!resend && process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

async function sendAdminInvitationResponseEmail(responseData) {
    const resendClient = getResendClient();
    if (!process.env.RESEND_API_KEY || !resendClient) {
        return { success: false, error: 'RESEND_API_KEY non configuré' };
    }

    const adminEmail = 'stroukouri@gmail.com';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const isTestMode = fromEmail.includes('onboarding@resend.dev');
    const testEmail = process.env.RESEND_TEST_EMAIL || adminEmail;
    const recipientEmail = isTestMode ? testEmail : adminEmail;

    try {
        const dateResponse = responseData.dateFormatted
            ? new Date(responseData.dateFormatted).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })
            : new Date().toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

        const emailHtml = generateAdminInvitationResponseTemplate(responseData, dateResponse);
        const emailText = getAdminInvitationResponseText(responseData, dateResponse);
        const emailSubject = `📧 Nouvelle réponse - ${responseData.eventType || 'Invitation'}`;

        const unverifiedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        const emailDomain = fromEmail.split('@')[1]?.toLowerCase();
        const shouldUseTestDomain = unverifiedDomains.includes(emailDomain || '');
        const finalFromEmail = shouldUseTestDomain ? 'onboarding@resend.dev' : fromEmail;

        const { data, error } = await resendClient.emails.send({
            from: finalFromEmail,
            to: recipientEmail,
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
        });

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function generateAdminInvitationResponseTemplate(responseData, dateResponse) {
    const { nom, prenom, eventType, attendance, guests, message, transporthouppa, transportChabbat } = responseData;
    const attendanceText = attendance === 'Oui' ? '✅ Oui' : '❌ Non';
    const attendanceColor = attendance === 'Oui' ? '#4caf50' : '#f44336';

    let transportInfo = '';
    if (eventType === 'Houppa' && transporthouppa) {
        transportInfo = `<tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Transport :</td><td style="padding: 8px 0; color: #333;">${escapeHtml(transporthouppa)}</td></tr>`;
    } else if (eventType === 'Chabbat' && transportChabbat) {
        transportInfo = `<tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Transport depuis Raanana :</td><td style="padding: 8px 0; color: #333;">${escapeHtml(transportChabbat)}</td></tr>`;
    }

    const detailsHtml = `
        <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; color: #333; width: 40%;">Personne :</td><td style="padding: 8px 0; color: #333;">${escapeHtml(prenom)} ${escapeHtml(nom)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Événement :</td><td style="padding: 8px 0; color: #333; font-weight: bold;">${escapeHtml(eventType || 'N/A')}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Présence :</td><td style="padding: 8px 0; color: ${attendanceColor}; font-weight: bold;">${attendanceText}</td></tr>
            ${attendance === 'Oui' && guests ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Nombre de personnes :</td><td style="padding: 8px 0; color: #333;">${guests}</td></tr>` : ''}
            ${transportInfo}
            <tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Date de réponse :</td><td style="padding: 8px 0; color: #333;">${escapeHtml(dateResponse)}</td></tr>
        </table>`;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Récapitulatif de réponse d'invitation</title>
</head>
<body style="margin:0; padding:0; font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #333; background: #F5EEE8;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
        <tr><td style="padding: 20px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #F5EEE8; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
                <tr><td style="padding: 32px 36px 40px;">
                    <h1 style="font-family: Charm, cursive; font-size: 26px; font-weight: 400; text-align: center; margin: 0 0 28px; color: #333;">📧 NOUVELLE RÉPONSE D'INVITATION</h1>
                    <div style="background: rgba(255,255,255,0.8); padding: 24px; border-radius: 8px; margin: 16px 0 24px; border-left: 4px solid #B8A8C8;">
                        <h2 style="font-family: Georgia, serif; font-size: 18px; color: #5a4a47; margin: 0 0 16px;">Détails de la réponse</h2>
                        ${detailsHtml}
                    </div>
                    ${message ? `<div style="background: #fff9e6; padding: 14px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e6c200;"><p style="margin:0; font-size: 15px; color: #333;"><strong>Message :</strong><br>${escapeHtml(message)}</p></div>` : ''}
                    <p style="font-size: 14px; color: #666; margin: 24px 0 0; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.08);">Cette réponse a également été envoyée à Notion.</p>
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;
}

function getAdminInvitationResponseText(responseData, dateResponse) {
    const { nom, prenom, eventType, attendance, guests, message, transporthouppa, transportChabbat } = responseData;
    let t = `📧 NOUVELLE RÉPONSE D'INVITATION\n\n`;
    t += `Personne : ${prenom} ${nom}\n`;
    t += `Événement : ${eventType || 'N/A'}\n`;
    t += `Présence : ${attendance === 'Oui' ? '✅ Oui' : '❌ Non'}\n`;
    if (attendance === 'Oui' && guests) t += `Nombre de personnes : ${guests}\n`;
    if (eventType === 'Houppa' && transporthouppa) t += `Transport : ${transporthouppa}\n`;
    if (eventType === 'Chabbat' && transportChabbat) t += `Transport depuis Raanana : ${transportChabbat}\n`;
    t += `Date de réponse : ${dateResponse}\n\n`;
    if (message) t += `Message : ${message}\n\n`;
    t += `Cette réponse a également été envoyée à Notion.\n`;
    return t;
}

module.exports = {
    sendAdminInvitationResponseEmail
};
