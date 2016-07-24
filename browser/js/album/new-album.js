app.config(($stateProvider) => {
	$stateProvider.state('newAlbum', {
		url: '/newAlbum',
		templateUrl: '/new-album.html',
		controller: 'NewAlbumCtrl'
	})
});

app.controller('NewAlbumCtrl', ($scope, $state, AlbumFactory, PhotosFactory, DialogFactory) => {
	$scope.createAlbum = () => {
        let album = {
            title: $scope.newAlbum
        }
        AlbumFactory.createAlbum(album).then(album => {
        	DialogFactory.display("Created");
        })
    }
});