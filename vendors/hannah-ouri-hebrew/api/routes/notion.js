const express = require('express');
const { sendToNotion } = require('../controllers/notionController');

const router = express.Router();
router.post('/send', sendToNotion);

module.exports = router;
