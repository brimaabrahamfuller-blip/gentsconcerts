const fs = require('fs');
const path = require('path');

const files = [
    { path: 'routes/users.js', content: "const express = require('express'); const router = express.Router(); const { protect } = require('../middleware/auth'); router.get('/profile', protect, (req, res) => res.json({success:true, data:req.user})); module.exports = router;" },
    { path: 'routes/events.js', content: "const express = require('express'); const router = express.Router(); module.exports = router;" },
    { path: 'routes/tickets.js', content: "const express = require('express'); const router = express.Router(); module.exports = router;" },
    { path: 'routes/payments.js', content: "const express = require('express'); const router = express.Router(); module.exports = router;" },
    { path: 'routes/admin.js', content: "const express = require('express'); const router = express.Router(); module.exports = router;" }
];

files.forEach(file => {
    fs.writeFileSync(path.join(__dirname, '..', file.path), file.content);
});
