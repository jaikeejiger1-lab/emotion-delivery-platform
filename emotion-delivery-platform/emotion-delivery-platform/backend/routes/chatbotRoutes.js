/**
 * chatbotRoutes.js
 */
const express = require('express');
const router  = express.Router();
const { handleMessage } = require('../controllers/chatbotController');

router.post('/message', handleMessage);

module.exports = router;
