const offerService = require('../services/offer.service');

module.exports = () => (req, res, next) => {
    req.storage = {
        ...offerService,
    };

    next();
};
