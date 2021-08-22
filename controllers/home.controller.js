const router = require('express').Router();

router.get('/', async (req, res) => {
    const offers = (await req.storage.getAll()).slice(0, 3);
    res.render('home', { offers });
});

module.exports = router;
