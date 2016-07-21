app.config(function ($stateProvider) {
    $stateProvider.state('photos', {
        url: '/photos',
        templateUrl: '/photos.html',
        controller: 'PhotoCtrl'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('addphoto', {
        url: '/photos',
        templateUrl: '/photos-add.html',
        controller: 'PhotoCtrl'
    });
});


app.config(function ($stateProvider) {
    $stateProvider.state('uploadPhotos', {
        url: '/upload',
        templateUrl: '/photos-upload.html',
        controller: 'UploadPhotoCtrl'
    });
});

