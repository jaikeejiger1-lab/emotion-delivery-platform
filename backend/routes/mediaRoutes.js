/**
 * mediaRoutes.js
 */
const express = require('express');
const router  = express.Router();
const { uploadVideo, generateQR, generateImage } = require('../controllers/mediaController');

// Serve static uploaded videos
const path = require('path');
router.use('/static', express.static(path.join(__dirname, '..', 'uploads')));

router.post('/upload-video',    uploadVideo);
router.post('/qr',              generateQR);
router.post('/generate-image',  generateImage);

module.exports = router;
