app.controller('PhotoCtrl', ($scope, $state, PhotosFactory, AlbumFactory, UserFactory) => {
    let albumArray = [];
    $scope.title = "Welcome";
    $scope.photosGot = false;
    $scope.uploadPage = () => {
        $state.go('addphoto');
    }

    AlbumFactory.fetchAll()
        .then(albums => {
            $scope.albums = albums;
        })
    PhotosFactory.fetchAll().then(photos => {
        $scope.photos = photos;
    })

    $scope.addPhotos = () => {
        for (var i = 1; i <= 44; i++) {
            let src = '/image/IMG_' + i + '.jpg';
            PhotosFactory.addPhoto(src);
        }
    }

    $scope.fetchAll = () => {
        PhotosFactory.fetchAll().then(photos => {
            $scope.photos = photos;
        })
    }


    $scope.createAlbum = () => {
        $scope.newAlbum = {
            title: $scope.albumName,
            photos: ['image/IMG_1.jpg']
        }
        PhotosFactory.createAlbum($scope.newAlbum);
    }

    $scope.getAlbums = () => {
        PhotosFactory.fetchAlbums()
            .then(albums => {
                $scope.albums = albums;
            })
    }

    $scope.addToAlbum = (photo) => {
        albumArray.push(photo);
    }

    $scope.saveAlbum = () => {
    }

    $scope.followPhoto = (photo) => {
        UserFactory.followPhoto(photo)
    }

   




});