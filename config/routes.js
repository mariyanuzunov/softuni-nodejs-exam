const authController = require('../controllers/auth.controller');
const homeController = require('../controllers/home.controller');
const offerController = require('../controllers/offer.controller');
const searchController = require('../controllers/search.controller');

module.exports = app => {
    app.use('/auth', authController);
    app.use('/offers', offerController);
    app.use('/search', searchController);
    app.use('/', homeController);
    app.use('*', (req, res) => {
        res.render('404');
    });
};
