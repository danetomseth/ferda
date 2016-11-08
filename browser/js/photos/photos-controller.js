app.controller('PhotoCtrl', ($scope, $state, PhotosFactory, AlbumFactory, UserFactory, photos) => {
    let albumArray = [];
    $scope.title = "Welcome";
    $scope.photosGot = false;
    $scope.selectedPage = 0;


    // $scope.photos = shuffle(photos);
    $scope.photoPages = splitArray(shuffle(photos));

    let photoArray = [];

    function splitArray(array) {
    	let returnArray = []
    	let chopArray = array;
    	while(chopArray.length) {
    		let newChunk = chopArray.splice(0, 20)
    		if(newChunk) {
    			returnArray.push(newChunk)
    		}
    	}
    	return returnArray;
    }

    function shuffle(array) {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        while (0 !== currentIndex) {

            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }


   


    $scope.setPage = (index) => {
    	$scope.selectedPage = index;
    }

     $scope.forward = () => {
     	if($scope.selectedPage < $scope.photoPages.length) {
    		$scope.selectedPage++;
     	}
    }

    $scope.backward = () => {
    	if($scope.selectedPage > 0) {
    		$scope.selectedPage--;
     	}
    }


    // function galleryPhotos (){
    // 	let array = $scope.photoPages[0];
    // 	let items = []
    // 	array.forEach(function(elem) {
    // 		let img = new Image();
    // 		img.src = elem.src;
    // 		console.log(img.width);
    // 		let newImg = {
    // 			src: elem.src,
    // 			w: 1200,
    // 			h: 800
    // 		}
    // 		items.push(newImg);
    // 	})
    // 	console.log(items);
    // 	$scope.galleryPhotos = items;
    // }

    $scope.openGallery = (index) => {
   		$scope.showGallery = true;
   		let slideIndex = index
    	$scope.slideIndex = index;
    	console.log(index);
    	$scope.active = index;
    	let imgArray = $scope.photoPages[$scope.selectedPage]
   	 	imgArray.forEach(function(elem, index) {
   	 		elem.id = index;
   	 		if(index === slideIndex) {
   	 			elem.active = true;
   	 			console.log("active:", elem);
   	 		}
   	 	})
       $scope.galleryPhotos = imgArray;
    }

    $scope.show = (photo) => {
   	 	// galleryPhotos();
   	 	

    }



});