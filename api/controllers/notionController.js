const axios = require('axios');
const { sendAdminInvitationResponseEmail } = require('./emailController');

function isInvitationResponse(data) {
    return data.eventType === 'Houppa' && data.attendance !== undefined;
}

/**
 * Envoie des données à Notion via webhook
 * POST /api/notion/send
 */
const sendToNotion = async (req, res, next) => {
    try {
        // Vérifier si le webhook Notion est configuré
        const webhookUrl = process.env.NOTION_WEBHOOK_URL;
        
        if (!webhookUrl) {
            return res.json({
                success: true,
                local: true,
                message: 'Données sauvegardées localement (Notion non configuré)'
            });
        }

        // Récupérer les données du body
        const data = req.body;

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucune donnée fournie'
            });
        }

        // Envoyer les données à Notion
        const response = await axios.post(webhookUrl, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Si c'est une réponse d'invitation, envoyer un email récapitulatif à l'admin
        if (isInvitationResponse(data)) {
            await sendAdminInvitationResponseEmail({
                nom: data.nom,
                prenom: data.prenom,
                eventType: data.eventType,
                attendance: data.attendance,
                guests: data.guests,
                message: data.message,
                transporthouppa: data.transporthouppa,
                transportChabbat: data.transportChabbat,
                dateFormatted: data.dateFormatted
            }).catch(() => {
                // Erreur silencieuse : on ne fait pas échouer la réponse si l'email échoue
            });
        }
        
        return res.json({
            success: true,
            remote: true,
            message: 'Données envoyées à Notion avec succès',
            data: response.data
        });
    } catch (error) {
        const eventType = req.body?.eventType || 'inconnu';
        
        // Si c'est une erreur axios, extraire plus d'infos
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: 'Erreur lors de l\'envoi à Notion',
                error: error.response.data || error.message,
                eventType: eventType,
                statusCode: error.response.status
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi à Notion',
            error: error.message,
            eventType: eventType
        });
    }
};

module.exports = {
    sendToNotion
};
