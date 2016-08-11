app.directive('photoGrid', ($rootScope) => {
	return {
		restrict: 'E',
		scope: {
			gridPhotos: '=photos'
		},
		controller: 'PhotoCtrl',
		templateUrl: 'js/common/directives/photo/photo-grid.html',
		link: (scope) => {
			console.log(scope.gridPhotos);
	}
}
});