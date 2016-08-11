app.config(function ($stateProvider) {
    $stateProvider.state('photos', {
        url: '/photos',
        templateUrl: 'js/photos/photos.html',
        controller: 'PhotoCtrl',
        data: {
            authenticate: true
        }
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('addphoto', {
        url: '/photos',
        templateUrl: 'js/photos/photos-add.html',
        controller: 'PhotoCtrl',
        data: {
            authenticate: true
        }
    });
});


app.config(function ($stateProvider) {
    $stateProvider.state('uploadPhotos', {
        url: '/upload',
        templateUrl: 'js/photos/photos-upload.html',
        controller: 'UploadPhotoCtrl',
        data: {
            authenticate: true
        }
    });
});

