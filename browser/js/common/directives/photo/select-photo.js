app.directive('selectPictures', ($rootScope) => {
	return {
		restrict: 'E',
		controller: 'PhotoCtrl',
		templateUrl: 'js/common/directives/photo/select-photo.html',
		link: (scope) => {
	}
}
});