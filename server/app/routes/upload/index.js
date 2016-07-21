'use strict';
var router = require('express').Router();
var bodyParser = require('body-parser');
//var Chat = Promise.promisifyAll(mongoose.model('Chat'));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

var mongoose = require('mongoose');