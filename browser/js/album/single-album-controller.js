app.controller('SingleAlbumCtrl', ($scope, $timeout, $state, album, AdminFactory, AlbumFactory, PhotosFactory) => {
	$scope.album = album;
	$scope.selectingCover = false;
	$scope.changesMade = false;
	$scope.removePhotos = false;
	$scope.removeFromAlbum = (photo) => {
		let photoIndex = $scope.album.photos.indexOf(photo);
		$scope.album.photos.splice(photoIndex, 1);
	}

	$scope.deletePhotos = () => {
		$scope.removePhotos = true;
	}

	$scope.selectCover = () => {
		$timeout(() => {
			$scope.selectingCover = true;
			$scope.changesMade = true;
		}, 500);
	}

	$scope.addCover = (photo) => {
        $scope.album.cover = photo._id;
        $scope.selectingCover = false;
    }

	$scope.updateAlbum = () => {
        AlbumFactory.updateAlbum($scope.album).then(res => {
            $state.go('admin');
        })
    }
});