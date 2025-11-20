const express = require('express');
const router = express.Router();

// Placeholder CV routes
router.get('/', (req, res) => {
	res.json({ message: 'CV route placeholder' });
});

module.exports = router;
