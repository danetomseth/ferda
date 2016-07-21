app.controller('SingleAlbumCtrl', ($scope, $state, album, AdminFactory, AlbumFactory, PhotosFactory) => {
	$scope.album = album;
	$scope.removeFromAlbum = (photo) => {
		let photoIndex = $scope.album.photos.indexOf(photo);
		$scope.album.photos.splice(photoIndex, 1);
	}

	$scope.updateAlbum = () => {
        AlbumFactory.updateAlbum($scope.album).then(res => {
            $state.go('admin');
        })
    }
});