const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { isGuest } = require('../middlewares/guards');
const { isUser } = require('../middlewares/guards');

router.get('/register', isGuest(), (req, res) => {
    res.render('user/register');
});

router.post(
    '/register',
    isGuest(),
    body('name')
        .trim()
        .matches(/[A-Z(1)][a-z]+ [A-Z(1)][a-z]+/)
        .withMessage('Invalid name!'),
    body('username')
        .trim()
        .isLength({ min: 5 })
        .withMessage('Username must be at least 5 characters long!'),
    body('password')
        .trim()
        .isLength({ min: 4 })
        .withMessage('Password must be at least 4 characters long!'),
    body('rePass')
        .trim()
        .custom((value, { req }) => {
            if (value != req.body.password) {
                throw new Error("Passwords don't match!");
            }

            return true;
        }),
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

            await req.auth.register(
                req.body.name,
                req.body.username,
                req.body.password
            );

            res.redirect('/');
        } catch (error) {
            const ctx = {
                errors: error.message.split('\n'),
                userData: {
                    username: req.body.username,
                    name: req.body.name,
                },
            };

            res.render('user/register', ctx);
        }
    }
);

router.get('/login', isGuest(), (req, res) => {
    res.render('user/login');
});

router.post('/login', isGuest(), async (req, res) => {
    try {
        await req.auth.login(req.body.username, req.body.password);
        res.redirect('/');
    } catch (error) {
        let errors = [error.message];
        if (error.type == 'credential') {
            errors = ['Incorect username or password!'];
        }

        const ctx = {
            errors,
            userData: {
                username: req.body.username,
            },
        };
        res.render('user/login', ctx);
    }
});

router.get('/logout', isUser(), (req, res) => {
    req.auth.logout();
    res.redirect('/');
});

module.exports = router;
