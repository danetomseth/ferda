app.config(($stateProvider) => {
	$stateProvider.state('signup', {
		url: '/signup',
		templateUrl: '/signup.html',
		controller: 'SignupCtrl'
	})
});