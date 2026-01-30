// Middleware de gestion des erreurs
const errorHandler = (err, req, res, next) => {
    // Erreur de validation Mongoose
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Erreur de validation',
            errors: messages
        });
    }

    // Erreur de duplication (unique)
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Cette entrée existe déjà'
        });
    }

    // Erreur de cast (ObjectId invalide)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'ID invalide'
        });
    }

    // Erreur par défaut
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erreur serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
