const router = require('express').Router();
const { isUser } = require('../middlewares/guards');
const { body, validationResult } = require('express-validator');

router.get('/', async (req, res) => {
    const offers = await req.storage.getAll();

    res.render('offers/catalogue', { offers });
});

router.get('/create', isUser(), (req, res) => {
    res.render('offers/create');
});

router.post(
    '/create',
    isUser(),
    body('name')
        .trim()
        .isLength({ min: 6 })
        .withMessage('Name must be at least 6 characters long!'),
    body('type')
        .trim()
        .matches(/Apartment|Villa|House/)
        .withMessage('Type must be Apartment, Villa or House!'),
    body('year')
        .isFloat({ min: 1850, max: 2021 })
        .withMessage('Year must be between 1850 and 2021!'),
    body('city')
        .trim()
        .isLength({ min: 4 })
        .withMessage('City must be at least 4 characters long!'),
    body('imgUrl')
        .trim()
        .custom(v => {
            if (v.startsWith('http://') || v.startsWith('https://')) {
                return true;
            }
            throw new Error(
                'The image url must start with http:// or https://'
            );
        }),
    body('description')
        .trim()
        .isLength({ max: 60 })
        .withMessage('Description should not exceed 60 characters!'),
    body('availablePieces')
        .isFloat({ min: 0, max: 10 })
        .withMessage('Available peaces must be between 0 and 10!'),
    async (req, res) => {
        const { errors } = validationResult(req);

        try {
            if (errors.length > 0) {
                throw new Error(
                    Object.values(errors)
                        .map(e => e.msg)
                        .join('\n')
                );
            }

            const offerData = {
                name: req.body.name,
                type: req.body.type,
                year: Number(req.body.year),
                city: req.body.city,
                imgUrl: req.body.imgUrl,
                description: req.body.description,
                availablePieces: Number(req.body.availablePieces),
                owner: req.user._id,
            };

            await req.storage.create(offerData);

            res.redirect('/offers');
        } catch (error) {
            const ctx = {
                errors: error.message.split('\n'),
                offerData: {
                    name: req.body.name,
                    type: req.body.type,
                    year: req.body.year,
                    city: req.body.city,
                    imgUrl: req.body.imgUrl,
                    description: req.body.description,
                    availablePieces: req.body.availablePieces,
                },
            };

            res.render('offers/create', ctx);
        }
    }
);

router.get('/details/:id', async (req, res) => {
    try {
        const offer = await req.storage.getById(req.params.id);
        offer.isOwner = req.user && req.user._id == offer.owner._id;
        offer.others = offer.tenants.map(x => x.name).join(', ');
        offer.hasFreePieces = offer.availablePieces > 0 ? true : false;
        offer.booked =
            req.user && offer.tenants.find(x => x._id == req.user._id);

        res.render('offers/details', { offer });
    } catch (error) {
        res.render('404');
    }
});

router.get('/edit/:id', isUser(), async (req, res) => {
    try {
        const offer = await req.storage.getById(req.params.id);

        if (offer.owner._id._id != req.user._id) {
            throw new Error('You can only edit your own offers!');
        }

        res.render('offers/edit', { offerData: offer });
    } catch (error) {
        res.redirect('/offers/details/' + req.params.id);
    }
});

router.post(
    '/edit/:id',
    isUser(),
    body('name')
        .trim()
        .isLength({ min: 6 })
        .withMessage('Name must be at least 6 characters long'),
    body('type')
        .trim()
        .matches(/Apartment|Villa|House/)
        .withMessage('Type must be Apartment, Villa or House'),
    body('year')
        .isFloat({ min: 1850, max: 2021 })
        .withMessage('Year must be between 1850 and 2021'),
    body('city')
        .trim()
        .isLength({ min: 4 })
        .withMessage('City must be at least 4 characters long'),
    body('imgUrl')
        .trim()
        .custom(v => {
            if (v.startsWith('http://') || v.startsWith('https://')) {
                return true;
            }
            throw new Error(
                'The image url must start with http:// or https://'
            );
        }),
    body('description')
        .trim()
        .isLength({ max: 60 })
        .withMessage('Description should not exceed 60 characters'),
    body('availablePieces')
        .isFloat({ min: 0, max: 10 })
        .withMessage('Available peaces must be between 0 and 10'),
    async (req, res) => {
        const { errors } = validationResult(req);
        try {
            const offer = await req.storage.getById(req.params.id);

            if (offer.owner._id != req.user._id) {
                throw new Error('You can only edit your own offers');
            }

            if (errors.length > 0) {
                throw new Error(
                    Object.values(errors)
                        .map(e => e.msg)
                        .join('\n')
                );
            }

            const offerData = {
                name: req.body.name,
                type: req.body.type,
                year: Number(req.body.year),
                city: req.body.city,
                imgUrl: req.body.imgUrl,
                description: req.body.description,
                availablePieces: Number(req.body.availablePieces),
            };

            await req.storage.edit(req.params.id, offerData);
            res.redirect('/offers/details/' + req.params.id);
        } catch (error) {
            const ctx = {
                errors: error.message.split('\n'),
                offerData: {
                    _id: req.params.id,
                    name: req.body.name,
                    type: req.body.type,
                    year: req.body.year,
                    city: req.body.city,
                    imgUrl: req.body.imgUrl,
                    description: req.body.description,
                    availablePieces: req.body.availablePieces,
                    owner: req.user._id,
                },
            };

            res.render('offers/edit', ctx);
        }
    }
);

router.get('/delete/:id', isUser(), async (req, res) => {
    try {
        const offer = await req.storage.getById(req.params.id);

        if (offer.owner._id != req.user._id) {
            throw new Error('You can only delete your own offers');
        }

        await req.storage.deleteById(req.params.id);
        res.redirect('/offers');
    } catch (error) {
        res.redirect('/offers/details/' + req.params.id);
    }
});

router.get('/book/:id', isUser(), async (req, res) => {
    try {
        const offer = await req.storage.getById(req.params.id);

        if (offer.owner._id == req.user._id) {
            throw new Error('You can not book your own offer');
        }

        await req.storage.book(req.params.id, req.user._id);
        res.redirect('/offers/details/' + req.params.id);
    } catch (error) {
        res.redirect('/offers/details/' + req.params.id);
    }
});

module.exports = router;
