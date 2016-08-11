app.config(($stateProvider) => {
	$stateProvider.state('calendar', {
		url: '/calendar',
		templateUrl: 'js/calendar/calendar.html',
		controller: 'CalendarCtrl',
		data: {
            authenticate: true
        }
	})
});