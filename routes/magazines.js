const express = require('express');
const { createMagazine, getAllMagazines, getMagazineById, deleteMagazine } = require('../controllers/magazineController');
const { protectAdmin, checkAdminRole } = require('../middleware/adminAuth');
const uploadHandler = require('../helper/uploadHandler').default || require('../helper/uploadHandler');
const router = express.Router();

// Public
router.get('/', getAllMagazines);
router.get('/:id', getMagazineById);

// Admin only
router.post('/',
    protectAdmin,
    checkAdminRole('ADMIN', 'SUPER_ADMIN', 'AUTHOR'),
    (req, res, next) => uploadHandler.uploadFile(req, res, next),
    createMagazine
);

router.delete('/:id',
    protectAdmin,
    checkAdminRole('ADMIN', 'SUPER_ADMIN'),
    deleteMagazine
);

module.exports = router;
