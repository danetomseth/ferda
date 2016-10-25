app.directive('ztSetSize', function() {
	return {
		restrict: 'A',
		link: (scope, element, attr) => {
			console.log("attributes: ", element[0].clientWidth);
			let width = (element[0].clientWidth * 0.66) + 'px';
			element.css({
				height: width
			})
		}
	}
});