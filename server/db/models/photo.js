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
    thumbSrc: {
        type: String
    },
    author: {
        type: String
    },
    album: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album'
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