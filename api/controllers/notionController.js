const axios = require('axios');

function isInvitationResponse(data) {
    return data.eventType === 'Houppa' && data.attendance !== undefined;
}

const sendToNotion = async (req, res, next) => {
    try {
        const webhookUrl = process.env.NOTION_WEBHOOK_URL;

        if (!webhookUrl) {
            return res.json({ success: true, local: true, message: 'Données sauvegardées localement' });
        }

        const data = req.body;
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({ success: false, message: 'Aucune donnée fournie' });
        }

        const response = await axios.post(webhookUrl, data, { headers: { 'Content-Type': 'application/json' } });

        return res.json({ success: true, remote: true, message: 'Données envoyées à Notion avec succès', data: response.data });
    } catch (error) {
        const eventType = req.body?.eventType || 'inconnu';
        if (error.response) {
            return res.status(error.response.status).json({ success: false, message: 'Erreur Notion', error: error.response.data || error.message, eventType, statusCode: error.response.status });
        }
        return res.status(500).json({ success: false, message: 'Erreur Notion', error: error.message, eventType });
    }
};

module.exports = { sendToNotion };
