app.config(function ($stateProvider) {
    $stateProvider.state('album', {
        url: '/Album',
        templateUrl: 'js/album/album.html'

    });
});


app.config(function ($stateProvider) {
    $stateProvider.state('singleAlbum', {
        url: '/Album/:albumId',
        templateUrl: 'templates/single-album.html',
        controller: 'SingleAlbumCtrl',
        resolve: {
        	album: (AlbumFactory, $stateParams) => {
        		return AlbumFactory.fetchOne($stateParams.albumId)
        	}
        }
      
    });
});
