app.directive('selectAlbum', ($rootScope) => {
	return {
		restrict: 'E',
		controller: 'AlbumsCtrl',
		templateUrl: 'js/common/directives/albums/album.html',
		link: (scope) => {
			// UserFactory.getUser().then(user => {
				// scope.user = user;
				// console.log(user);
			// })

			scope.message = "hello";
	}
}
});