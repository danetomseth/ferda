'use strict';
var mongoose = require('mongoose');

var _ = require('lodash');

var schema = new mongoose.Schema({
    title: {
        type: String
    },
    src: {
        type: String
    },
    thumb: {
        type: String
    },
    author: {
        type: String
    },
    album: {
        type: String
    },
    tags: {
        type: Array,
        default: ['none']
    },
    height: {
        type: Number,
        default: 200
    },
    date: {
    	type: Date, 
    	default: Date.now
    }
});



mongoose.model('Photo', schema);