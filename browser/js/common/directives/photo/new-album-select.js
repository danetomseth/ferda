app.directive('newAlbumSelect', ($rootScope) => {
	return {
		restrict: 'E',
		controller: 'NewAlbumCtrl',
		templateUrl: 'js/common/directives/photo/new-album-select.html',
		link: (scope) => {
	}
}
});