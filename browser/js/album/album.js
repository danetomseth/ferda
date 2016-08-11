app.config(function ($stateProvider) {
    $stateProvider.state('album', {
        url: '/Album',
        templateUrl: 'js/album/album.html',
        data: {
            authenticate: true
        }

    });
});


app.config(function ($stateProvider) {
    $stateProvider.state('singleAlbum', {
        url: '/Album/:albumId',
        templateUrl: 'js/album/single-album.html',
        controller: 'SingleAlbumCtrl',
        data: {
            authenticate: true
        },
        resolve: {
        	album: (AlbumFactory, $stateParams) => {
        		return AlbumFactory.fetchOne($stateParams.albumId)
        	}
        }
      
    });
});
