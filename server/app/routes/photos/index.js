'use strict';
var router = require('express').Router();
var path = require('path');
var uniqueFilename = require('unique-filename');
var busboy = require('connect-busboy'); //middleware for form/file upload
var mongoose = require('mongoose');
var AWS = require('aws-sdk');
var sKey = require(path.join(__dirname, '../../../env')).AKID;
var bodyParser = require('body-parser');
var im = require('imagemagick');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));
var Photo = mongoose.model('Photo')
router.use(busboy());


router.post('/add', (req, res, next) => {
    Photo.create(req.body)
        .then((photo, err) => {
            if (err) {
                console.log('error saving photo', err);
                next(err);
            } else {
                res.send("Saved").status(202);
            }
        })
});


router.get('/', (req, res, next) => {
    Photo.find({})
        .then((photos) => {
            res.send(photos);
        })
});

router.get('/limit10', (req, res, next) => {
    Photo.find({})
        .limit(10)
        .then((photos) => {
            res.send(photos);
        })
});

router.get('/:album', (req, res, next) => {
    Photo.find({album: req.params.album})
        .then((photos) => {
            console.log(photos);
            res.send(photos);
        })
});

router.post('/update', (req, res, next) => {
    var query = {
        "_id": req.body._id
    };
    var update = req.body;
    var options = {
        new: true
    };
    Photo.findOneAndUpdate(query, update, options, function(err, photo) {
        if (err) {
            console.log('got an error');
            next(err);
        }
        res.sendStatus(200);
    });
});




// var addToDb = function(fileName) {
//     var s3Path = 'https://s3.amazonaws.com/dirtybird-images/';
//     Photo.create({
//         path: s3Path + fileName,
//         thumbPath: s3Path + 'thumbnail-' + fileName,
//         author: 'Dane',
//         name: fileName
//     })
//     .then(function(err, data) {
//         if (err) {
//             err.message = "Error saving photo to DB"
//             err.status = 500;
//             return err
//         }
//         return;
//     })
//     .then(null, console.error.bind(console))
// }

// function createThumbnail(file, filename) {
//     im.resize({
//         srcPath: 'https://s3.amazonaws.com/dirtybird-images/' + filename,
//         width: 800
//     }, function(err, stdout) {
//         //error handling with stderr
//         if (err) throw err;
//         var base64data = new Buffer(stdout, 'binary');
//         var s3bucket = new AWS.S3({
//             params: {
//                 Bucket: 'dirtybird-images'
//             }
//         });
//         s3bucket.createBucket(function(err) {
//             if (err) {
//                 err.message = "Error uploading Thumbnail"
//                 err.status = 500;
//                 throw err
//             }
//             var params = {
//                 Key: 'thumbnail-' + filename,
//                 Body: base64data
//             };
//             //removed err
//             s3bucket.upload(params, function() {
//                 console.log("Successfully uploaded thumbnail");
//                 return
//             });
//         });

//     });
// }


// router.get('/', function(req, res) {
//     res.sendStatus(200);
// })

// //Router used by Albums
// router.get('/fetchAll', function(req, res) {
//     Photo.find({}).then(function(data) {
//         res.send(data);
//     })

// })

// router.post('/upload', function(req, res, next) {
//     req.pipe(req.busboy);
//     req.busboy.on('file', function(fieldname, file) {
//         var filename = uniqueFilename('upload-img') + '.jpg';
//         filename = filename.replace(/\//g, '-');
//         var s3bucket = new AWS.S3({
//             params: {
//                 Bucket: 'dirtybird-images'
//             }
//         });
//         s3bucket.createBucket(function(err) {
//             if (err) {
//                 err.message = "Error uploading photo"
//                 err.status = 500;
//                 next(err)
//             }
//             var params = {
//                 Key: filename,
//                 ContentType: 'image/jpeg',
//                 Body: file
//             };
//             s3bucket.upload(params, function() {
//                 createThumbnail(file, filename);
//                 addToDb(filename);
//                 res.sendStatus(201);
//                 res.end();
//             });
//         });
//     });


// })

// router.delete('/deleteImage/:id', function(req, res, next) {
//     Photo.remove({
//         _id: req.params.id
//     })
//         .then(function(err) {
//             if (err) {
//                 err.message = "Error deleting image"
//                 err.status = 500
//                 next(err)
//             }
//             res.json('removed');
//         })
// })

// router.post('/uploadDb', function(req, res, next) {

//     var s3bucket = new AWS.S3({
//         params: {
//             Bucket: 'dirtybird-images'
//         }
//     });
//     s3bucket.createBucket(function(err) {
//         if (err) {
//             err.message = "Error uploading photo"
//             err.status = 500;
//             next(err)
//         }
//         var params = {
//             Key: sKey,
//             Body: 'Hello!'
//         };
//         s3bucket.upload(params, function() {
//             console.log("Uploaded Photo");
//         });
//     });
// })

module.exports = router;