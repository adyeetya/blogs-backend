const express = require('express');
const controller = require('../controllers/magazineController');
const { protectAdmin, checkAdminRole } = require('../middleware/adminAuth');
const uploadPdf =  require('../helper/pdfUpload');
const uploadHandler = require('../helper/uploadHandler').default || require('../helper/uploadHandler');
const router = express.Router();

// Public
router.get('/', controller.list);
router.get("/:slug", controller.getBySlug);

// Admin only
router.post('/',
    // protectAdmin,
    // checkAdminRole('ADMIN', 'SUPER_ADMIN', 'AUTHOR'),
   
    controller.create
);

router.post("/:slug/pdf", (req, res, next) => {
  uploadPdf(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, controller.uploadPdfAndProcess);

// router.delete('/:id',
//     protectAdmin,
//     checkAdminRole('ADMIN', 'SUPER_ADMIN'),
//     deleteMagazine
// );

module.exports = router;
