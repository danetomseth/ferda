app.directive('photoEdit', (PhotosFactory) => {
	return {
		restrict: 'E',
		templateUrl: 'js/common/directives/photo/photo-edit.html',
		link: (scope, elem, attr) => {
			scope.savePhoto = () => {
				console.log('photo', scope.photo);
				PhotosFactory.savePhoto(scope.photo)
			}
		}
	}
});