app.controller('AlbumsCtrl', ($scope, $state, PhotosFactory, AlbumFactory, UserFactory) => {
	AlbumFactory.fetchAll()
        .then(albums => {
        	console.log('fetching albums');
            $scope.albums = albums;
            $scope.albumOne = $scope.albums[0];
        });

    $scope.viewAlbum = (album) => {
        $state.go('singleAlbum', {albumId: album._id})
    }

    $scope.followAlbum = (album) => {
    	console.log('following', album);
    	UserFactory.followAlbum(album)
    }

});