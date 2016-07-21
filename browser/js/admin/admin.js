app.config(function ($stateProvider) {
    $stateProvider.state('admin', {
        url: '/admin',
        templateUrl: 'templates/admin.html',
        controller: 'AlbumCtrl'
    });
});