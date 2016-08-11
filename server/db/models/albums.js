'use strict';
var mongoose = require('mongoose');

var _ = require('lodash');

var schema = new mongoose.Schema({
    title: {
        type: String
    },
    photos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Photo'
    }],
    cover: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Photo'
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    private: {
        type: Boolean,
        default: 'false'
    },
    description: {
        type: String
    },
    date: {
    	type: Date, 
    	default: Date.now
    }
});



mongoose.model('Album', schema);