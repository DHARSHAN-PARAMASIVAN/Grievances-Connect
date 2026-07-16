const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.resolve(__dirname, '../..', 'uploads', fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  return res.sendFile(filePath);
});

module.exports = router;
