app.directive('banner', ($rootScope, $state, UserFactory) => {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/banner/banner.html',
        link: (scope) => {
            UserFactory.getUser().then(user => {
                scope.user = user;
                console.log(user);
            });
            scope.showAlbums = false;


            scope.addAlbums = () => {
                scope.showAlbums = true;
            }

            scope.viewAlbum = (album) => {
                $state.go('singleAlbum', {
                    albumId: album._id
                })
            }

        }
    }
});