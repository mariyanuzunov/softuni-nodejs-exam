const router = require('express').Router();
const { isUser } = require('../middlewares/guards');

router.get('/', isUser(), async (req, res) => {
    res.render('search');
});

router.post('/', isUser(), async (req, res) => {
    const offers = await req.storage.getAll(req.body.searchTerm);
    res.render('search', { offers });
});

module.exports = router;
