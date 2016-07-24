app.controller('SignupCtrl', ($scope, $rootScope, UserFactory) => {
	$scope.user = {};
	$scope.submit = () => {
		console.log($scope.user);
		UserFactory.createUser($scope.user)
		.then(user => {
			$rootScope.user = user;
			console.log('root user', $rootScope.user);
		})
	}
});