'use strict';
var router = require('express').Router();

module.exports = router;

router.use('/members', require('./members'));


router.use('/chats', require('./chats'));

router.use('/photos', require('./photos'));
router.use('/albums', require('./albums'));



// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});


