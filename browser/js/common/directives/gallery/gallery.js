app.directive('photoGallery', function() {
    return {
        restrict: 'AE',
        templateUrl: 'js/common/directives/gallery/gallery.html',
        link: function(scope, element, attrs) {

            scope.startGallery = (item) => {
            	console.log(item);
            }
        }
    };
});