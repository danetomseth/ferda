app.config(function ($stateProvider) {
    $stateProvider.state('albums', {
        url: '/albums',
        templateUrl: '/albums.html',
        controller: 'AlbumsCtrl'
    });
});