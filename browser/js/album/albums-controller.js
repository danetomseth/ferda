app.controller('AlbumsCtrl', ($scope, $state, PhotosFactory, AlbumFactory) => {
	AlbumFactory.fetchAll()
        .then(albums => {
            $scope.albums = albums;
            $scope.albumOne = $scope.albums[0];
        });

    $scope.viewAlbum = (album) => {
        $state.go('singleAlbum', {albumId: album._id})
    }

});