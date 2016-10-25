'use strict';
window.app = angular.module('ZTF', ['fsaPreBuilt', 'bootstrapLightbox', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'angularFileUpload', 'ngMaterial', 'akoenig.deckgrid']);

app.config(function ($urlRouterProvider, $locationProvider, $mdThemingProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    var customPrimary = {
        '50': '#d8bf8c',
        '100': '#d1b579',
        '200': '#cbaa66',
        '300': '#c4a053',
        '400': '#bd9540',
        '500': '#aa863a',
        '600': '#977734',
        '700': '#84682d',
        '800': '#715927',
        '900': '#5e4a20',
        'A100': '#deca9f',
        'A200': '#e5d4b2',
        'A400': '#ebdfc5',
        'A700': '#4b3b1a'
    };

    $mdThemingProvider.theme('default').primaryPalette('blue').accentPalette('light-green').warnPalette('yellow');
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            //$rootScope.loggedInUser = user;
            // if (user) {
            //     $state.go(toState.name, toParams);
            // } else {
            //     $state.go('login');
            // }
        });
    });
});

app.controller("AdminCtrl", function ($scope, $state, AdminFactory, AlbumFactory, PhotosFactory) {
    $scope.addingPictures = false;

    AlbumFactory.fetchAll().then(function (albums) {
        console.log('fetched', albums);
        $scope.albums = albums;
        $scope.albumOne = $scope.albums[0];
    });

    PhotosFactory.fetchTen().then(function (photos) {
        $scope.photos = photos;
    });

    $scope.deleteAlbum = function (album) {
        AlbumFactory.deleteAlbum(album._id);
        var albumIndex = $scope.albums.indexOf(album);
        $scope.albums.splice(albumIndex, 1);
    };

    $scope.createAlbum = function () {
        var album = {
            title: $scope.newAlbum
        };
        AlbumFactory.createAlbum(album).then(function (album) {
            $scope.albums.push(album);
            $scope.newAlbum = "";
        });
    };

    $scope.addPhotos = function (album) {
        $scope.selectingPictures = true;
        $scope.currentAlbum = album;
        PhotosFactory.fetchAll().then(function (photos) {
            $scope.photos = photos;
        });
    };

    $scope.viewAlbum = function (album) {
        $state.go('singleAlbum', { albumId: album._id });
    };

    $scope.updateAlbum = function () {
        AlbumFactory.updateAlbum($scope.currentAlbum).then(function (res) {
            $state.reload();
        });
    };

    $scope.uploadPhotos = function () {
        $state.go('uploadPhotos');
    };

    $scope.addToAlbum = function (photo) {
        $scope.currentAlbum.photos.push(photo._id);
    };
});
app.factory("AdminFactory", function ($http) {
    return {};
});
app.config(function ($stateProvider) {
    $stateProvider.state('admin', {
        url: '/admin',
        templateUrl: 'js/admin/admin.html',
        controller: 'AlbumCtrl',
        data: {
            authenticate: true
        }
    });
});
(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.
    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q, $state) {
        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin)['catch'](function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin)['catch'](function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

app.config(function ($stateProvider) {
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/auth/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, $state, AuthService, DialogFactory) {
    $scope.login = function () {
        var credentials = {
            email: $scope.email,
            password: $scope.password
        };
        AuthService.login(credentials).then(function (res) {
            $state.go('home');
        });
    };

    $scope.getUser = function () {
        AuthService.getLoggedInUser().then(function (user) {
            console.log('Login.js: logged in user', user);
        });
    };
});
app.controller('AlbumCtrl', function ($scope, $timeout, $state, AdminFactory, AlbumFactory, PhotosFactory, DialogFactory) {
    $scope.addingPictures = false;

    AlbumFactory.fetchAll().then(function (albums) {
        $scope.albums = albums;
        $scope.albumOne = $scope.albums[0];
    });

    PhotosFactory.fetchTen().then(function (photos) {
        $scope.photos = photos;
    });

    $scope.deleteAlbum = function (album) {
        AlbumFactory.deleteAlbum(album._id);
        var albumIndex = $scope.albums.indexOf(album);
        $scope.albums.splice(albumIndex, 1);
    };

    $scope.createAlbum = function () {
        var album = {
            title: $scope.newAlbum
        };
        AlbumFactory.createAlbum(album).then(function (album) {
            DialogFactory.display("Created");
        });
    };

    $scope.addPhotos = function (album) {
        $scope.selectingPictures = true;
        $scope.currentAlbum = album;
        PhotosFactory.fetchAll().then(function (photos) {
            $scope.photos = photos;
        });
    };

    $scope.viewAlbum = function (album) {};

    $scope.updateAlbum = function () {
        AlbumFactory.updateAlbum($scope.currentAlbum).then(function (res) {
            DialogFactory.display("Updated", 1500);
            $timeout(function () {
                $state.reload();
            }, 1000);
        });
    };

    $scope.viewAlbum = function (album) {
        $state.go('singleAlbum', { albumId: album._id });
    };

    $scope.addToAlbum = function (photo) {
        $scope.currentAlbum.photos.push(photo._id);
        DialogFactory.display("Added", 1000);
    };
});
app.factory('AlbumFactory', function ($http) {
    return {
        createAlbum: function createAlbum(album) {
            return $http.post('/api/albums/', album).then(function (res) {
                return res.data;
            });
        },
        fetchAll: function fetchAll() {
            return $http.get('/api/albums/').then(function (res) {
                return res.data;
            });
        },
        updateAlbum: function updateAlbum(album) {
            return $http.post('/api/albums/update', album).then(function (res) {
                return res.data;
            });
        },
        fetchOne: function fetchOne(albumId) {
            return $http.get('/api/albums/' + albumId).then(function (res) {
                return res.data;
            });
        },
        findUserAlbums: function findUserAlbums(userId) {
            return $http.get('/api/albums/user/' + userId).then(function (res) {
                return res.data;
            });
        },
        addPhoto: function addPhoto(photoId) {
            return $http.post('/api/albums/photo/' + photoId).then(function (res) {
                return res.data;
            });
        },
        deleteAlbum: function deleteAlbum(albumId) {
            return $http['delete']('/api/albums/' + albumId);
        }
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('album', {
        url: '/Album',
        templateUrl: 'js/album/album.html'

    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('singleAlbum', {
        url: '/Album/:albumId',
        templateUrl: 'js/album/single-album.html',
        controller: 'SingleAlbumCtrl',
        resolve: {
            album: function album(AlbumFactory, $stateParams) {
                return AlbumFactory.fetchOne($stateParams.albumId);
            }
        }

    });
});

app.controller('AlbumsCtrl', function ($scope, $state, PhotosFactory, AlbumFactory, UserFactory, DialogFactory) {
    AlbumFactory.fetchAll().then(function (albums) {
        $scope.albums = albums;
        $scope.albumOne = $scope.albums[0];
    });

    $scope.viewAlbum = function (album) {
        $state.go('singleAlbum', { albumId: album._id });
    };

    $scope.followAlbum = function (album) {
        UserFactory.followAlbum(album);
    };

    $scope.createAlbum = function () {
        $state.go('newAlbum');
        // let album = {
        //     title: $scope.newAlbum
        // }
        // AlbumFactory.createAlbum(album).then(album => {
        //     DialogFactory.display("Created");
        // })
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('albums', {
        url: '/albums',
        templateUrl: 'js/album/albums.html',
        controller: 'AlbumsCtrl'
    });
});
app.config(function ($stateProvider) {
    $stateProvider.state('editAlbum', {
        url: '/editAlbum/:albumId',
        templateUrl: 'js/album/edit-album.html',
        controller: 'EditAlbumCtrl',
        resolve: {
            album: function album(AlbumFactory, $stateParams) {
                return AlbumFactory.fetchOne($stateParams.albumId);
            }
        }
    });
});

app.controller('EditAlbumCtrl', function ($scope, AlbumFactory, PhotosFactory, DialogFactory, album) {
    $scope.addingPictures = false;

    var setDate = function setDate() {
        album.date = new Date(album.date);
        $scope.album = album;
    };
    setDate();

    $scope.saveAlbum = function () {
        AlbumFactory.updateAlbum($scope.album).then(function (res) {
            $scope.album = res;
            $scope.selectingPictures = false;
            DialogFactory.display('Saved', 1000);
        });
    };

    $scope.addPhotos = function () {
        console.log('adding');
        PhotosFactory.fetchAll().then(function (photos) {
            console.log('photos', photos);
            $scope.selectingPictures = true;
            $scope.photos = photos;
        });
    };

    $scope.addToAlbum = function (photo) {
        $scope.album.photos.push(photo._id);
    };
});
app.controller('NewAlbumCtrl', function ($scope, $state, AlbumFactory, PhotosFactory, Session, DialogFactory, AuthService) {
    console.log('Session', Session);
    $scope.showPhotos = false;

    $scope.createAlbum = function () {
        $scope.album.owner = Session.user._id;
        console.log($scope.album);
        AlbumFactory.createAlbum($scope.album).then(function (album) {
            DialogFactory.display("Created", 1000);
            $scope.album = album;
            return PhotosFactory.fetchAll();
        }).then(function (photos) {
            console.log(photos);
            $scope.photos = photos;
            $scope.showPhotos = true;
        });
    };

    $scope.addToAlbum = function (photo) {
        DialogFactory.display('Added', 750);
        $scope.album.photos.push(photo);
        $scope.album.cover = photo;
    };

    $scope.saveAlbum = function () {
        AlbumFactory.updateAlbum($scope.album).then(function (album) {
            $state.go('albums');
        });
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('newAlbum', {
        url: '/newAlbum',
        templateUrl: 'js/album/new-album.html',
        controller: 'NewAlbumCtrl'
    });
});

app.controller('SingleAlbumCtrl', function ($scope, $timeout, $state, album, AdminFactory, AlbumFactory, PhotosFactory) {
    $scope.album = album;
    $scope.selectingCover = false;
    $scope.changesMade = false;
    $scope.removePhotos = false;
    $scope.removeFromAlbum = function (photo) {
        var photoIndex = $scope.album.photos.indexOf(photo);
        $scope.album.photos.splice(photoIndex, 1);
    };

    $scope.deletePhotos = function () {
        $scope.removePhotos = true;
    };

    $scope.selectCover = function () {
        $timeout(function () {
            $scope.selectingCover = true;
            $scope.changesMade = true;
        }, 500);
    };

    $scope.addCover = function (photo) {
        $scope.album.cover = photo._id;
        $scope.selectingCover = false;
    };

    $scope.updateAlbum = function () {
        AlbumFactory.updateAlbum($scope.album).then(function (res) {
            $state.go('admin');
        });
    };
});
app.controller('CalendarCtrl', function ($scope, UserFactory, AuthService) {});
app.config(function ($stateProvider) {
    $stateProvider.state('calendar', {
        url: '/calendar',
        templateUrl: 'js/calendar/calendar.html',
        controller: 'CalendarCtrl'
    });
});
app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: '/js/home/home.html'

    });
});
app.config(function ($stateProvider) {
    $stateProvider.state('layout', {
        url: '/layout',
        templateUrl: 'js/layout/layout.html',
        controller: 'LayoutCtrl',
        resolve: {
            albums: function albums(AlbumFactory, $stateParams) {
                return AlbumFactory.fetchAll();
            }
        }
    });
});

app.controller('LayoutCtrl', function ($scope, PhotosFactory, albums) {
    console.log("all albums", albums);
    $scope.albums = albums;
    $scope.getFiles = function () {
        console.log("getting Files");
        PhotosFactory.getFiles();
    };
});
app.controller('PhotoCtrl', function ($scope, $state, PhotosFactory, AlbumFactory, UserFactory, photos) {
    var albumArray = [];
    $scope.title = "Welcome";
    $scope.photosGot = false;
    $scope.uploadPage = function () {
        $state.go('addphoto');
    };

    // AlbumFactory.fetchAll()
    //     .then(albums => {
    //         $scope.albums = albums;
    //     })
    // PhotosFactory.fetchAll().then(photos => {
    //     $scope.photos = photos;
    // })
    console.log(photos);

    $scope.photos = photos;

    $scope.addPhotos = function () {
        for (var i = 1; i <= 44; i++) {
            var src = '/image/IMG_' + i + '.jpg';
            PhotosFactory.addPhoto(src);
        }
    };

    $scope.fetchAll = function () {
        PhotosFactory.fetchAll().then(function (photos) {
            $scope.photos = photos;
        });
    };

    $scope.createAlbum = function () {
        $scope.newAlbum = {
            title: $scope.albumName,
            photos: ['image/IMG_1.jpg']
        };
        PhotosFactory.createAlbum($scope.newAlbum);
    };

    $scope.getAlbums = function () {
        PhotosFactory.fetchAlbums().then(function (albums) {
            $scope.albums = albums;
        });
    };

    $scope.addToAlbum = function (photo) {
        albumArray.push(photo);
    };

    $scope.saveAlbum = function () {};

    $scope.followPhoto = function (photo) {
        UserFactory.followPhoto(photo);
    };
});
app.factory('PhotosFactory', function ($http) {
    return {
        addPhoto: function addPhoto(src) {
            var photo = {
                src: src,
                name: 'test'
            };
            $http.post('/api/photos/add', photo).then(function (res) {});
        },
        savePhoto: function savePhoto(photo) {
            $http.post('/api/photos/update', photo).then(function (res) {
                console.log(res.data);
            });
        },
        fetchAll: function fetchAll() {
            return $http.get('/api/photos').then(function (res) {
                return res.data;
            });
        },
        fetchTen: function fetchTen() {
            return $http.get('/api/photos/limit10').then(function (res) {
                return res.data;
            });
        },
        getFiles: function getFiles() {
            $http.get('/api/getFiles/albumA').then(function (res) {
                console.log("Returned: ", res.data);
            });
        }
    };
});
app.controller('UploadPhotoCtrl', function ($scope, $state, PhotosFactory, AlbumFactory, FileUploader) {
    AlbumFactory.fetchAll().then(function (albums) {
        $scope.albums = albums;
    });

    $scope.createAlbum = function () {
        var album = {
            title: $scope.newAlbum
        };
        AlbumFactory.createAlbum(album).then(function (album) {
            $scope.albums.push(album);
            $scope.photoAlbum = album._id;
        });
    };

    var uploader = $scope.uploader = new FileUploader({
        url: '/api/photos/uploadAWS'
    });
    uploader.filters.push({
        name: 'imageFilter',
        fn: function fn(item, /*{File|FileLikeObject}*/options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    });
    var count = 1;
    uploader.onWhenAddingFileFailed = function (item, /*{File|FileLikeObject}*/filter, options) {
        console.info('onWhenAddingFileFailed', item, filter, options);
    };
    uploader.onAfterAddingFile = function (fileItem) {
        // console.info('onAfterAddingFile', fileItem);
        var photoInfo = {
            title: $scope.title + '-' + count,
            album: $scope.photoAlbum
        };
        fileItem.formData.push(photoInfo);
        count++;
        console.log('file', fileItem);
    };
    uploader.onAfterAddingAll = function (addedFileItems) {
        console.info('onAfterAddingAll', addedFileItems);
    };
    uploader.onBeforeUploadItem = function (item) {
        console.info('onBeforeUploadItem', item);
    };
    uploader.onProgressItem = function (fileItem, progress) {
        console.info('onProgressItem', fileItem, progress);
    };
    uploader.onProgressAll = function (progress) {
        console.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function (fileItem, response, status, headers) {
        console.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function (fileItem, response, status, headers) {
        console.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function (fileItem, response, status, headers) {
        console.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function (fileItem, response, status, headers) {
        console.info('onCompleteItem', fileItem, response, status, headers);
    };
    uploader.onCompleteAll = function () {
        console.info('onCompleteAll');
        // $scope.finish();
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('photos', {
        url: '/photos',
        templateUrl: 'js/photos/photos.html',
        controller: 'PhotoCtrl',
        resolve: {
            photos: function photos(PhotosFactory, $stateParams) {
                return PhotosFactory.fetchAll();
            }
        }
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('addphoto', {
        url: '/photos',
        templateUrl: 'js/photos/photos-add.html',
        controller: 'PhotoCtrl'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('uploadPhotos', {
        url: '/upload',
        templateUrl: 'js/photos/photos-upload.html',
        controller: 'UploadPhotoCtrl'
    });
});

app.controller('SignupCtrl', function ($scope, $rootScope, UserFactory) {
    $scope.user = {};
    $scope.submit = function () {
        UserFactory.createUser($scope.user).then(function (user) {
            $rootScope.user = user;
        });
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('signup', {
        url: '/signup',
        templateUrl: 'js/signup/signup.html',
        controller: 'SignupCtrl'
    });
});

app.factory('DialogFactory', function ($http, $mdDialog, $timeout) {

    var showDialog = function showDialog(message) {
        var parentEl = angular.element(document.body);
        $mdDialog.show({
            parent: parentEl,
            template: '<md-dialog aria-label="List dialog" id="dialog">' + '  <md-dialog-content>' + message + '  </md-dialog-content>' + '</md-dialog>'
        });
    };

    return {
        display: function display(message, timeout) {
            showDialog(message);
            $timeout(function () {
                $mdDialog.hide();
            }, timeout);
        }
    };
});
app.directive('ztSetSize', function () {
    return {
        restrict: 'A',
        link: function link(scope, element, attr) {
            console.log("attributes: ", element[0].clientWidth);
            var width = element[0].clientWidth * 0.66 + 'px';
            element.css({
                height: width
            });
        }
    };
});
app.factory('UserFactory', function ($http, $rootScope, DialogFactory) {
    return {
        currentUser: function currentUser() {
            var user = {
                name: 'Dane',
                picture: 'Something',
                albums: ['One', 'Two', 'Three']
            };
            return user;
            //send request for current logged-in user
        },
        createUser: function createUser(user) {
            return $http.post('/api/users/', user).then(function (res) {
                return res.data;
            });
        },
        getUser: function getUser() {
            var username = 'danetomseth';
            return $http.get('/api/users/' + username).then(function (res) {
                $rootScope.user = res.data;
                return res.data;
            });
        },

        //User settings
        // followAlbum: (albumId) => {
        // 	let body = {
        // 		albumId: albumId,
        // 		userId: $rootScope.user._id
        // 	}
        // 	$http.post('/api/users/album', body).then(res => {
        // 		if(res.status === 200) {
        // 			DialogFactory.display('Added To Albums', 1000)
        // 		}
        // 		else {
        // 			DialogFactory.display('Status not 200', 1000)
        // 		}
        // 	})
        // }
        followAlbum: function followAlbum(album) {
            var user = $rootScope.user;
            if (user.albums.indexOf() !== -1) {
                console.log('album already exists');
            }
            user.albums.push(album);

            $http.post('/api/users/update', user).then(function (res) {
                if (res.status === 200) {
                    DialogFactory.display('Added To Albums', 1000);
                } else {
                    DialogFactory.display('Status not 200', 1000);
                }
            });
        },
        followPhoto: function followPhoto(photo) {
            var user = $rootScope.user;
            if (user.photos.indexOf() !== -1) {
                console.log('Photo already exists');
            }
            user.photos.push(photo);

            $http.post('/api/users/update', user).then(function (res) {
                if (res.status === 200) {
                    DialogFactory.display('Added To Photos', 1000);
                } else {
                    DialogFactory.display('Status not 200', 1000);
                }
            });
        }
    };
});
app.directive('albumCard', function ($rootScope, $state) {
    return {
        restrict: 'E',
        controller: 'AlbumsCtrl',
        scope: {
            album: '='
        },
        templateUrl: 'js/common/directives/albums/album-card.html',
        link: function link(scope) {
            scope.editAlbum = function () {
                console.log(scope.album.cover.thumbSrc);
                // $state.go('editAlbum', {albumId: scope.album._id});
            };

            scope.viewAlbum = function () {
                $state.go('singleAlbum', { albumId: scope.album._id });
            };

            scope.addToFavorites = function () {
                console.log("call user here");
            };
        }
    };
});
app.directive('selectAlbum', function ($rootScope) {
    return {
        restrict: 'E',
        controller: 'AlbumsCtrl',
        templateUrl: 'js/common/directives/albums/album.html',
        link: function link(scope) {}
    };
});
app.directive('userAlbums', function ($rootScope, $state) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/albums/user-albums.html',
        link: function link(scope) {
            scope.editAlbum = function () {
                $state.go('editAlbum', { albumId: scope.album._id });
            };

            scope.addToFavorites = function () {
                console.log("call user here");
            };
        }
    };
});
app.directive('banner', function ($rootScope, $state, Session, UserFactory, AlbumFactory, AuthService) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/banner/banner.html',
        link: function link(scope) {
            // UserFactory.getUser().then(user => {
            //     scope.user = user;
            //     return AlbumFactory.findUserAlbums(user._id)
            // }).then(albums => {
            //     scope.user.albums.push(albums);
            //     console.log(scope.user.albums);
            // })

            UserFactory.getUser().then(function (user) {
                scope.user = user;
                console.log(scope.user);

                return AlbumFactory.findUserAlbums(user._id);
            }).then(function (albums) {
                scope.userAlbums = albums;
                if (scope.user.albums.length) {
                    scope.userAlbums.push(scope.user.albums);
                }
                console.log(scope.userAlbums);
            });

            // AlbumFactory.findUserAlbums(Session.user._id)
            // .then(albums => {
            //     scope.userAlbums = albums;
            //     console.log(scope.userAlbums);
            // })

            AuthService.getLoggedInUser().then(function (user) {
                if (user) {
                    scope.user = user;
                } else {
                    scope.user = {
                        first: 'Guest',
                        last: ''
                    };
                }
            });
            scope.showAlbums = false;
            scope.showPictures = false;

            scope.addAlbums = function () {
                scope.showAlbums = true;
            };

            scope.addPictures = function () {
                scope.showPictures = true;
            };

            scope.viewAlbum = function (album) {
                $state.go('singleAlbum', {
                    albumId: album._id
                });
            };
        }
    };
});
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                scope.currentPage = toState.name;
            });

            scope.items = [{
                label: 'Home',
                state: 'home'
            }, {
                label: 'Photos',
                state: 'photos'
            }, {
                label: 'Albums',
                state: 'albums'
            }, {
                label: 'Schedule',
                state: 'calendar'
            }, {
                label: 'Admin',
                state: 'admin'
            }];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('home');
                });
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});
app.directive('newAlbumSelect', function ($rootScope) {
    return {
        restrict: 'E',
        controller: 'NewAlbumCtrl',
        templateUrl: 'js/common/directives/photo/new-album-select.html',
        link: function link(scope) {}
    };
});
app.directive('photoEdit', function (PhotosFactory) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/photo/photo-edit.html',
        link: function link(scope, elem, attr) {
            scope.savePhoto = function () {
                PhotosFactory.savePhoto(scope.photo);
            };
        }
    };
});
app.directive('photoGrid', function ($rootScope) {
    return {
        restrict: 'E',
        scope: {
            gridPhotos: '=photos'
        },
        controller: 'PhotoCtrl',
        templateUrl: 'js/common/directives/photo/photo-grid.html',
        link: function link(scope) {
            console.log(scope.gridPhotos);
        }
    };
});
app.directive('selectPictures', function ($rootScope) {
    return {
        restrict: 'E',
        controller: 'PhotoCtrl',
        templateUrl: 'js/common/directives/photo/select-photo.html',
        link: function link(scope) {}
    };
});
app.directive('singlePhoto', function ($rootScope, $state) {
    return {
        restrict: 'E',
        scope: {
            photo: '='
        },
        templateUrl: 'js/common/directives/photo/single-photo.html',
        link: function link(scope) {
            scope.viewPhoto = function () {
                console.log(scope.photo);
                // $state.go('editphoto', {photoId: scope.photo._id});
            };
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFkbWluL2FkbWluLWNvbnRyb2xsZXIuanMiLCJhZG1pbi9hZG1pbi1mYWN0b3J5LmpzIiwiYWRtaW4vYWRtaW4uanMiLCJhdXRoL2F1dGguanMiLCJhdXRoL2xvZ2luLmpzIiwiYWxidW0vYWxidW0tY29udHJvbGxlci5qcyIsImFsYnVtL2FsYnVtLWZhY3RvcnkuanMiLCJhbGJ1bS9hbGJ1bS5qcyIsImFsYnVtL2FsYnVtcy1jb250cm9sbGVyLmpzIiwiYWxidW0vYWxidW1zLmpzIiwiYWxidW0vZWRpdC1hbGJ1bS5qcyIsImFsYnVtL25ldy1hbGJ1bS1jb250cm9sbGVyLmpzIiwiYWxidW0vbmV3LWFsYnVtLmpzIiwiYWxidW0vc2luZ2xlLWFsYnVtLWNvbnRyb2xsZXIuanMiLCJjYWxlbmRhci9jYWxlbmRhci1jb250cm9sbGVyLmpzIiwiY2FsZW5kYXIvY2FsZW5kYXIuanMiLCJob21lL2hvbWUuanMiLCJsYXlvdXQvbGF5b3V0LmpzIiwicGhvdG9zL3Bob3Rvcy1jb250cm9sbGVyLmpzIiwicGhvdG9zL3Bob3Rvcy1mYWN0b3J5LmpzIiwicGhvdG9zL3Bob3Rvcy11cGxvYWQtY29udHJvbGxlci5qcyIsInBob3Rvcy9waG90b3MuanMiLCJzaWdudXAvc2lnbnVwLWNvbnRyb2xsZXIuanMiLCJzaWdudXAvc2lnbnVwLmpzIiwiY29tbW9uL2RpYWxvZy9kaWFsb2ctZmFjdG9yeS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3NldFNpemUuanMiLCJjb21tb24vZmFjdG9yaWVzL3VzZXItZmFjdG9yeS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2FsYnVtcy9hbGJ1bS1jYXJkLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYWxidW1zL2FsYnVtLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYWxidW1zL3VzZXItYWxidW1zLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvYmFubmVyL2Jhbm5lci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9waG90by9uZXctYWxidW0tc2VsZWN0LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcGhvdG8vcGhvdG8tZWRpdC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3Bob3RvL3Bob3RvLWdyaWQuanMiLCJjb21tb24vZGlyZWN0aXZlcy9waG90by9zZWxlY3QtcGhvdG8uanMiLCJjb21tb24vZGlyZWN0aXZlcy9waG90by9zaW5nbGUtcGhvdG8uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBQSxDQUFBO0FBQ0EsTUFBQSxDQUFBLEdBQUEsR0FBQSxPQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxtQkFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLG1CQUFBLEVBQUEsWUFBQSxFQUFBLGtCQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUEsa0JBQUEsRUFBQTs7QUFFQSxxQkFBQSxDQUFBLFNBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTs7QUFFQSxzQkFBQSxDQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLFFBQUEsYUFBQSxHQUFBO0FBQ0EsWUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxjQUFBLEVBQUEsU0FBQTtBQUNBLGNBQUEsRUFBQSxTQUFBO0FBQ0EsY0FBQSxFQUFBLFNBQUE7QUFDQSxjQUFBLEVBQUEsU0FBQTtLQUNBLENBQUE7O0FBR0Esc0JBQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxDQUFBLENBQ0EsY0FBQSxDQUFBLE1BQUEsQ0FBQSxDQUNBLGFBQUEsQ0FBQSxhQUFBLENBQUEsQ0FDQSxXQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7OztBQUdBLEdBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsUUFBQSw0QkFBQSxHQUFBLFNBQUEsNEJBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLEtBQUEsQ0FBQSxJQUFBLElBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBLENBQUE7S0FDQSxDQUFBOzs7O0FBSUEsY0FBQSxDQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsWUFBQSxDQUFBLDRCQUFBLENBQUEsT0FBQSxDQUFBLEVBQUE7OztBQUdBLG1CQUFBO1NBQ0E7O0FBRUEsWUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLEVBQUE7OztBQUdBLG1CQUFBO1NBQ0E7OztBQUdBLGFBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQTs7QUFFQSxtQkFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7Ozs7Ozs7OztTQVVBLENBQUEsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUN6RUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7O0FBRUEsZ0JBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLFNBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsUUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsVUFBQSxHQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxZQUFBLEtBQUEsR0FBQTtBQUNBLGlCQUFBLEVBQUEsTUFBQSxDQUFBLFFBQUE7U0FDQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxRQUFBLEdBQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLGlCQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFlBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFHQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLENBQUEsWUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFlBQUEsR0FBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBLEVBQUEsQ0FBQSxjQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxZQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDMURBLEdBQUEsQ0FBQSxPQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUVBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNKQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFFBQUE7QUFDQSxtQkFBQSxFQUFBLHFCQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0FBQ0EsWUFBQSxFQUFBO0FBQ0Esd0JBQUEsRUFBQSxJQUFBO1NBQ0E7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNUQSxDQUFBLFlBQUE7O0FBRUEsZ0JBQUEsQ0FBQTs7O0FBR0EsUUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSx3QkFBQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBO0FBQ0EsZUFBQSxNQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7Ozs7O0FBS0EsT0FBQSxDQUFBLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxvQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7QUFDQSxzQkFBQSxFQUFBLHNCQUFBO0FBQ0Esd0JBQUEsRUFBQSx3QkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsZ0JBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGFBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7U0FDQSxDQUFBO0FBQ0EsZUFBQTtBQUNBLHlCQUFBLEVBQUEsdUJBQUEsUUFBQSxFQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsVUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsWUFBQSxDQUFBLElBQUEsQ0FBQSxDQUNBLFdBQUEsRUFDQSxVQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsaUJBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLGlCQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsRUFBQSxFQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLElBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQTs7OztBQUlBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsZ0JBQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxJQUFBLFVBQUEsS0FBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTthQUNBOzs7OztBQUtBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLGlCQUFBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FFQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxXQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUNBLENBQUEsWUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsNEJBQUEsRUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsRUFBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsRUFBQSxDQUFBOztBQ25JQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFFBQUE7QUFDQSxtQkFBQSxFQUFBLG9CQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxXQUFBLEdBQUE7QUFDQSxpQkFBQSxFQUFBLE1BQUEsQ0FBQSxLQUFBO0FBQ0Esb0JBQUEsRUFBQSxNQUFBLENBQUEsUUFBQTtTQUNBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSwwQkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO1NBRUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ3pCQSxHQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBOztBQUVBLGdCQUFBLENBQUEsUUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxHQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUEsS0FBQSxHQUFBO0FBQ0EsaUJBQUEsRUFBQSxNQUFBLENBQUEsUUFBQTtTQUNBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSx5QkFBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxpQkFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxZQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EscUJBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUEsRUFFQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx5QkFBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFlBQUE7QUFDQSxzQkFBQSxDQUFBLE1BQUEsRUFBQSxDQUFBO2FBQ0EsRUFBQSxJQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLFlBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHFCQUFBLENBQUEsT0FBQSxDQUFBLE9BQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FJQSxDQUFBLENBQUE7QUMvREEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQSxLQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxjQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxtQkFBQSxFQUFBLHFCQUFBLEtBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsb0JBQUEsRUFBQSxLQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLGtCQUFBLE9BQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsY0FBQSxHQUFBLE9BQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLHNCQUFBLEVBQUEsd0JBQUEsTUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxtQkFBQSxHQUFBLE1BQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGdCQUFBLEVBQUEsa0JBQUEsT0FBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxvQkFBQSxHQUFBLE9BQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLG1CQUFBLEVB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QUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsaUJBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSx5QkFBQSxDQUFBLE9BQUEsQ0FBQSxPQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsaUJBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQzVDQSxHQUFBLENBQUEsVUFBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQSxPQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFdBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFVBQUEsR0FBQSxLQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLEdBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSx5QkFBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxtQkFBQSxhQUFBLENBQUEsUUFBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFVBQUEsR0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUlBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLE9BQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNoQ0EsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSx5QkFBQTtBQUNBLGtCQUFBLEVBQUEsY0FBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNOQSxHQUFBLENBQUEsVUFBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFdBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsWUFBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxHQUFBLElBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxjQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxXQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsRUFBQSxHQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFFBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxLQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsRUFBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQy9CQSxHQUFBLENBQUEsVUFBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBLEVBRUEsQ0FBQSxDQUFBO0FDRkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSwyQkFBQTtBQUNBLGtCQUFBLEVBQUEsY0FBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ05BLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEsb0JBQUE7O0tBRUEsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDTkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSx1QkFBQTtBQUNBLGtCQUFBLEVBQUEsWUFBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLGtCQUFBLEVBQUEsZ0JBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLHVCQUFBLFlBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTthQUNBO1NBQ0E7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBR0EsR0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsQ0FBQSxHQUFBLENBQUEsWUFBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBO0FBQ0EscUJBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNyQkEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFFBQUEsVUFBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFNBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsVUFBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsRUFBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7Ozs7Ozs7O0FBU0EsV0FBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxhQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsRUFBQSxDQUFBLElBQUEsRUFBQSxFQUFBLENBQUEsRUFBQSxFQUFBO0FBQ0EsZ0JBQUEsR0FBQSxHQUFBLGFBQUEsR0FBQSxDQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EseUJBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EscUJBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLEdBQUE7QUFDQSxpQkFBQSxFQUFBLE1BQUEsQ0FBQSxTQUFBO0FBQ0Esa0JBQUEsRUFBQSxDQUFBLGlCQUFBLENBQUE7U0FDQSxDQUFBO0FBQ0EscUJBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxxQkFBQSxDQUFBLFdBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFlBQUEsRUFDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FPQSxDQUFBLENBQUE7QUNoRUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxrQkFBQSxHQUFBLEVBQUE7QUFDQSxnQkFBQSxLQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLEdBQUE7QUFDQSxvQkFBQSxFQUFBLE1BQUE7YUFDQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxLQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUEsRUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGlCQUFBLEVBQUEsbUJBQUEsS0FBQSxFQUFBO0FBQ0EsaUJBQUEsQ0FBQSxJQUFBLENBQUEsb0JBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGdCQUFBLEVBQUEsb0JBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGdCQUFBLEVBQUEsb0JBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLHFCQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsaUJBQUEsQ0FBQSxHQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNuQ0EsR0FBQSxDQUFBLFVBQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxLQUFBLEdBQUE7QUFDQSxpQkFBQSxFQUFBLE1BQUEsQ0FBQSxRQUFBO1NBQ0EsQ0FBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsVUFBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUdBLFFBQUEsUUFBQSxHQUFBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsSUFBQSxZQUFBLENBQUE7QUFDQSxXQUFBLEVBQUEsdUJBQUE7S0FDQSxDQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLFlBQUEsRUFBQSxhQUFBO0FBQ0EsVUFBQSxFQUFBLFlBQUEsSUFBQSwyQkFBQSxPQUFBLEVBQUE7QUFDQSxnQkFBQSxJQUFBLEdBQUEsR0FBQSxHQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsV0FBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLG1CQUFBLHdCQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBLENBQUE7QUFDQSxRQUFBLEtBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsc0JBQUEsR0FBQSxVQUFBLElBQUEsMkJBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxJQUFBLENBQUEsd0JBQUEsRUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxpQkFBQSxHQUFBLFVBQUEsUUFBQSxFQUFBOztBQUVBLFlBQUEsU0FBQSxHQUFBO0FBQ0EsaUJBQUEsRUFBQSxNQUFBLENBQUEsS0FBQSxHQUFBLEdBQUEsR0FBQSxLQUFBO0FBQ0EsaUJBQUEsRUFBQSxNQUFBLENBQUEsVUFBQTtTQUNBLENBQUE7QUFDQSxnQkFBQSxDQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7QUFDQSxhQUFBLEVBQUEsQ0FBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxFQUFBLFFBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxnQkFBQSxHQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLElBQUEsQ0FBQSxrQkFBQSxFQUFBLGNBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxrQkFBQSxHQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLElBQUEsQ0FBQSxvQkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxjQUFBLEdBQUEsVUFBQSxRQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLElBQUEsQ0FBQSxnQkFBQSxFQUFBLFFBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7QUFDQSxZQUFBLENBQUEsYUFBQSxHQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLElBQUEsQ0FBQSxlQUFBLEVBQUEsUUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLGFBQUEsR0FBQSxVQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxJQUFBLENBQUEsZUFBQSxFQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxRQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsSUFBQSxDQUFBLGFBQUEsRUFBQSxRQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7QUFDQSxZQUFBLENBQUEsWUFBQSxHQUFBLFVBQUEsUUFBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLElBQUEsQ0FBQSxjQUFBLEVBQUEsUUFBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLGNBQUEsR0FBQSxVQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUEsTUFBQSxFQUFBLE9BQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxJQUFBLENBQUEsZ0JBQUEsRUFBQSxRQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7QUFDQSxZQUFBLENBQUEsYUFBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLENBQUEsSUFBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBOztLQUVBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNwRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSx1QkFBQTtBQUNBLGtCQUFBLEVBQUEsV0FBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLGtCQUFBLEVBQUEsZ0JBQUEsYUFBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLHVCQUFBLGFBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTthQUNBO1NBQ0E7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSwyQkFBQTtBQUNBLGtCQUFBLEVBQUEsV0FBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFHQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsY0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLDhCQUFBO0FBQ0Esa0JBQUEsRUFBQSxpQkFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUM1QkEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxJQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxVQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLHNCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNSQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLHVCQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ05BLEdBQUEsQ0FBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxRQUFBLEVBQUE7O0FBR0EsUUFBQSxVQUFBLEdBQUEsU0FBQSxVQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsWUFBQSxRQUFBLEdBQUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLGtCQUFBLEVBQUEsUUFBQTtBQUNBLG9CQUFBLEVBQ0Esa0RBQUEsR0FDQSx1QkFBQSxHQUNBLE9BQUEsR0FDQSx3QkFBQSxHQUNBLGNBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUdBLFdBQUE7QUFDQSxlQUFBLEVBQUEsaUJBQUEsT0FBQSxFQUFBLE9BQUEsRUFBQTtBQUNBLHNCQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFlBQUE7QUFDQSx5QkFBQSxDQUFBLElBQUEsRUFBQSxDQUFBO2FBQ0EsRUFBQSxPQUFBLENBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUlBLENBQUEsQ0FBQTtBQzVCQSxHQUFBLENBQUEsU0FBQSxDQUFBLFdBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsY0FBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtBQUNBLGdCQUFBLEtBQUEsR0FBQSxPQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsV0FBQSxHQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLHNCQUFBLEVBQUEsS0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1hBLEdBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLFVBQUEsRUFBQSxhQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSx1QkFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQTtBQUNBLG9CQUFBLEVBQUEsTUFBQTtBQUNBLHVCQUFBLEVBQUEsV0FBQTtBQUNBLHNCQUFBLEVBQUEsQ0FBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLE9BQUEsQ0FBQTthQUNBLENBQUE7QUFDQSxtQkFBQSxJQUFBLENBQUE7O1NBRUE7QUFDQSxrQkFBQSxFQUFBLG9CQUFBLElBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsYUFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGVBQUEsRUFBQSxtQkFBQTtBQUNBLGdCQUFBLFFBQUEsR0FBQSxhQUFBLENBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGFBQUEsR0FBQSxRQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSwwQkFBQSxDQUFBLElBQUEsR0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQSxtQkFBQSxFQUFBLHFCQUFBLEtBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxVQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsSUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLENBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLHNCQUFBLENBQUEsQ0FBQTthQUNBO0FBQ0EsZ0JBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsSUFBQSxDQUFBLG1CQUFBLEVBQUEsSUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esb0JBQUEsR0FBQSxDQUFBLE1BQUEsS0FBQSxHQUFBLEVBQUE7QUFDQSxpQ0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO2lCQUNBLE1BQ0E7QUFDQSxpQ0FBQSxDQUFBLE9BQUEsQ0FBQSxnQkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO2lCQUNBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxtQkFBQSxFQUFBLHFCQUFBLEtBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxVQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsSUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLENBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLHNCQUFBLENBQUEsQ0FBQTthQUNBO0FBQ0EsZ0JBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsSUFBQSxDQUFBLG1CQUFBLEVBQUEsSUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esb0JBQUEsR0FBQSxDQUFBLE1BQUEsS0FBQSxHQUFBLEVBQUE7QUFDQSxpQ0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO2lCQUNBLE1BQ0E7QUFDQSxpQ0FBQSxDQUFBLE9BQUEsQ0FBQSxnQkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO2lCQUNBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDeEVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxrQkFBQSxFQUFBLFlBQUE7QUFDQSxhQUFBLEVBQUE7QUFDQSxpQkFBQSxFQUFBLEdBQUE7U0FDQTtBQUNBLG1CQUFBLEVBQUEsNkNBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0Es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LENBQUEsVUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EscUJBQUEsQ0FBQSxVQUFBLEdBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EscUJBQUEsQ0FBQSxZQUFBLEdBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHNCQUFBLENBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLDJCQUFBLEVBQUEsS0FBQSxDQUFBLEdBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTtTQUVBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQy9EQSxHQUFBLENBQUEsU0FBQSxDQUFBLFFBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsYUFBQSxFQUFBLEVBQUE7QUFDQSxtQkFBQSxFQUFBLHlDQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBOztBQUVBLHNCQUFBLENBQUEsR0FBQSxDQUFBLHFCQUFBLEVBQ0EsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQSxTQUFBLEVBQUEsVUFBQSxFQUFBO0FBQ0EscUJBQUEsQ0FBQSxXQUFBLEdBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLEtBQUEsR0FBQSxDQUFBO0FBQ0EscUJBQUEsRUFBQSxNQUFBO0FBQ0EscUJBQUEsRUFBQSxNQUFBO2FBQ0EsRUFBQTtBQUNBLHFCQUFBLEVBQUEsUUFBQTtBQUNBLHFCQUFBLEVBQUEsUUFBQTthQUNBLEVBQUE7QUFDQSxxQkFBQSxFQUFBLFFBQUE7QUFDQSxxQkFBQSxFQUFBLFFBQUE7YUFDQSxFQUNBO0FBQ0EscUJBQUEsRUFBQSxVQUFBO0FBQ0EscUJBQUEsRUFBQSxVQUFBO2FBQ0EsRUFDQTtBQUNBLHFCQUFBLEVBQUEsT0FBQTtBQUNBLHFCQUFBLEVBQUEsT0FBQTthQUNBLENBQUEsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxVQUFBLEdBQUEsWUFBQTtBQUNBLHVCQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLDJCQUFBLENBQUEsTUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSwwQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtpQkFDQSxDQUFBLENBQUE7YUFDQSxDQUFBOztBQUlBLGdCQUFBLE9BQUEsR0FBQSxTQUFBLE9BQUEsR0FBQTtBQUNBLDJCQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EseUJBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO2lCQUNBLENBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsZ0JBQUEsVUFBQSxHQUFBLFNBQUEsVUFBQSxHQUFBO0FBQ0EscUJBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxtQkFBQSxFQUFBLENBQUE7O0FBRUEsc0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLFlBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsQ0FBQSxDQUFBO1NBRUE7O0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ25FQSxHQUFBLENBQUEsU0FBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0Esa0JBQUEsRUFBQSxjQUFBO0FBQ0EsbUJBQUEsRUFBQSxrREFBQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQSxFQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1JBLEdBQUEsQ0FBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsYUFBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEsNENBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGlCQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSw2QkFBQSxDQUFBLFNBQUEsQ0FBQSxLQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7YUFDQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDVkEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsYUFBQSxFQUFBO0FBQ0Esc0JBQUEsRUFBQSxTQUFBO1NBQ0E7QUFDQSxrQkFBQSxFQUFBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLDRDQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDWkEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxnQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLGtCQUFBLEVBQUEsV0FBQTtBQUNBLG1CQUFBLEVBQUEsOENBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsRUFDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNSQSxHQUFBLENBQUEsU0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsYUFBQSxFQUFBO0FBQ0EsaUJBQUEsRUFBQSxHQUFBO1NBQ0E7QUFDQSxtQkFBQSxFQUFBLDhDQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0EsaUJBQUEsQ0FBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTs7YUFFQSxDQUFBO1NBR0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ1pURicsIFsnZnNhUHJlQnVpbHQnLCdib290c3RyYXBMaWdodGJveCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICdhbmd1bGFyRmlsZVVwbG9hZCcsICduZ01hdGVyaWFsJywgJ2Frb2VuaWcuZGVja2dyaWQnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRtZFRoZW1pbmdQcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgICB2YXIgY3VzdG9tUHJpbWFyeSA9IHtcbiAgICAgICAgJzUwJzogJyNkOGJmOGMnLFxuICAgICAgICAnMTAwJzogJyNkMWI1NzknLFxuICAgICAgICAnMjAwJzogJyNjYmFhNjYnLFxuICAgICAgICAnMzAwJzogJyNjNGEwNTMnLFxuICAgICAgICAnNDAwJzogJyNiZDk1NDAnLFxuICAgICAgICAnNTAwJzogJyNhYTg2M2EnLFxuICAgICAgICAnNjAwJzogJyM5Nzc3MzQnLFxuICAgICAgICAnNzAwJzogJyM4NDY4MmQnLFxuICAgICAgICAnODAwJzogJyM3MTU5MjcnLFxuICAgICAgICAnOTAwJzogJyM1ZTRhMjAnLFxuICAgICAgICAnQTEwMCc6ICcjZGVjYTlmJyxcbiAgICAgICAgJ0EyMDAnOiAnI2U1ZDRiMicsXG4gICAgICAgICdBNDAwJzogJyNlYmRmYzUnLFxuICAgICAgICAnQTcwMCc6ICcjNGIzYjFhJ1xuICAgIH07XG4gIFxuXG4gICAkbWRUaGVtaW5nUHJvdmlkZXIudGhlbWUoJ2RlZmF1bHQnKVxuICAgICAgIC5wcmltYXJ5UGFsZXR0ZSgnYmx1ZScpXG4gICAgICAgLmFjY2VudFBhbGV0dGUoJ2xpZ2h0LWdyZWVuJylcbiAgICAgICAud2FyblBhbGV0dGUoJ3llbGxvdycpXG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgLy8kcm9vdFNjb3BlLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgICAgICAgICAvLyBpZiAodXNlcikge1xuICAgICAgICAgICAgLy8gICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb250cm9sbGVyKFwiQWRtaW5DdHJsXCIsICgkc2NvcGUsICRzdGF0ZSwgQWRtaW5GYWN0b3J5LCBBbGJ1bUZhY3RvcnksIFBob3Rvc0ZhY3RvcnkpID0+IHtcbiAgICAkc2NvcGUuYWRkaW5nUGljdHVyZXMgPSBmYWxzZTtcblxuICAgIEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgIC50aGVuKGFsYnVtcyA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZmV0Y2hlZCcsIGFsYnVtcyk7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtT25lID0gJHNjb3BlLmFsYnVtc1swXTtcbiAgICAgICAgfSk7XG5cbiAgICBQaG90b3NGYWN0b3J5LmZldGNoVGVuKClcbiAgICAgICAgLnRoZW4ocGhvdG9zID0+IHtcbiAgICAgICAgICAgICRzY29wZS5waG90b3MgPSBwaG90b3M7XG4gICAgICAgIH0pO1xuXG4gICAgJHNjb3BlLmRlbGV0ZUFsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgICAgIEFsYnVtRmFjdG9yeS5kZWxldGVBbGJ1bShhbGJ1bS5faWQpO1xuICAgICAgICBsZXQgYWxidW1JbmRleCA9ICRzY29wZS5hbGJ1bXMuaW5kZXhPZihhbGJ1bSk7XG4gICAgICAgICRzY29wZS5hbGJ1bXMuc3BsaWNlKGFsYnVtSW5kZXgsIDEpO1xuICAgIH1cblxuICAgICRzY29wZS5jcmVhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgbGV0IGFsYnVtID0ge1xuICAgICAgICAgICAgdGl0bGU6ICRzY29wZS5uZXdBbGJ1bVxuICAgICAgICB9XG4gICAgICAgIEFsYnVtRmFjdG9yeS5jcmVhdGVBbGJ1bShhbGJ1bSkudGhlbihhbGJ1bSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1zLnB1c2goYWxidW0pO1xuICAgICAgICAgICAgJHNjb3BlLm5ld0FsYnVtID0gXCJcIjtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAkc2NvcGUuYWRkUGhvdG9zID0gKGFsYnVtKSA9PiB7XG4gICAgICAgICRzY29wZS5zZWxlY3RpbmdQaWN0dXJlcyA9IHRydWU7XG4gICAgICAgICRzY29wZS5jdXJyZW50QWxidW0gPSBhbGJ1bTtcbiAgICAgICAgUGhvdG9zRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgICAgICAudGhlbihwaG90b3MgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS5waG90b3MgPSBwaG90b3M7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkc2NvcGUudmlld0FsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgXHQkc3RhdGUuZ28oJ3NpbmdsZUFsYnVtJywge2FsYnVtSWQ6IGFsYnVtLl9pZH0pXG4gICAgfVxuXG5cbiAgICAkc2NvcGUudXBkYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgIEFsYnVtRmFjdG9yeS51cGRhdGVBbGJ1bSgkc2NvcGUuY3VycmVudEFsYnVtKS50aGVuKHJlcyA9PiB7XG4gICAgICAgIFx0JHN0YXRlLnJlbG9hZCgpO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgICRzY29wZS51cGxvYWRQaG90b3MgPSAoKSA9PiB7XG4gICAgICAgICRzdGF0ZS5nbygndXBsb2FkUGhvdG9zJyk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmFkZFRvQWxidW0gPSAocGhvdG8pID0+IHtcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRBbGJ1bS5waG90b3MucHVzaChwaG90by5faWQpO1xuICAgIH1cbn0pIiwiYXBwLmZhY3RvcnkoXCJBZG1pbkZhY3RvcnlcIiwgKCRodHRwKSA9PiB7XG5cdHJldHVybiB7XG5cdFx0XG5cdH1cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluJywge1xuICAgICAgICB1cmw6ICcvYWRtaW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FkbWluL2FkbWluLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWxidW1DdHJsJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSwgJHN0YXRlKSB7XG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZygoJHN0YXRlUHJvdmlkZXIpID0+IHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJyx7XG5cdFx0dXJsOiAnL2xvZ2luJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2F1dGgvbG9naW4uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0xvZ2luQ3RybCdcblx0fSlcbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgKCRzY29wZSwgJHN0YXRlLCBBdXRoU2VydmljZSwgRGlhbG9nRmFjdG9yeSkgPT4ge1xuXHQkc2NvcGUubG9naW4gPSAoKSA9PiB7XG5cdFx0bGV0IGNyZWRlbnRpYWxzID0ge1xuXHRcdFx0ZW1haWw6ICRzY29wZS5lbWFpbCxcblx0XHRcdHBhc3N3b3JkOiAkc2NvcGUucGFzc3dvcmRcblx0XHR9XG5cdFx0QXV0aFNlcnZpY2UubG9naW4oY3JlZGVudGlhbHMpLnRoZW4oKHJlcykgPT4ge1xuXHRcdFx0JHN0YXRlLmdvKCdob21lJyk7XG5cdFx0fSk7XG5cdH1cblxuXHQkc2NvcGUuZ2V0VXNlciA9ICgpID0+IHtcblx0XHRBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKHVzZXIgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ0xvZ2luLmpzOiBsb2dnZWQgaW4gdXNlcicsIHVzZXIpO1xuXHRcdFx0XG5cdFx0fSlcblx0fVxufSkiLCJhcHAuY29udHJvbGxlcignQWxidW1DdHJsJywgKCRzY29wZSwgJHRpbWVvdXQsICRzdGF0ZSwgQWRtaW5GYWN0b3J5LCBBbGJ1bUZhY3RvcnksIFBob3Rvc0ZhY3RvcnksIERpYWxvZ0ZhY3RvcnkpID0+IHtcbiAgICAkc2NvcGUuYWRkaW5nUGljdHVyZXMgPSBmYWxzZTtcblxuICAgIEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgIC50aGVuKGFsYnVtcyA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtT25lID0gJHNjb3BlLmFsYnVtc1swXTtcbiAgICAgICAgfSk7XG5cbiAgICBQaG90b3NGYWN0b3J5LmZldGNoVGVuKClcbiAgICAgICAgLnRoZW4ocGhvdG9zID0+IHtcbiAgICAgICAgICAgICRzY29wZS5waG90b3MgPSBwaG90b3M7XG4gICAgICAgIH0pO1xuXG4gICAgJHNjb3BlLmRlbGV0ZUFsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgICAgIEFsYnVtRmFjdG9yeS5kZWxldGVBbGJ1bShhbGJ1bS5faWQpO1xuICAgICAgICBsZXQgYWxidW1JbmRleCA9ICRzY29wZS5hbGJ1bXMuaW5kZXhPZihhbGJ1bSk7XG4gICAgICAgICRzY29wZS5hbGJ1bXMuc3BsaWNlKGFsYnVtSW5kZXgsIDEpO1xuICAgIH1cblxuICAgICRzY29wZS5jcmVhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgbGV0IGFsYnVtID0ge1xuICAgICAgICAgICAgdGl0bGU6ICRzY29wZS5uZXdBbGJ1bVxuICAgICAgICB9XG4gICAgICAgIEFsYnVtRmFjdG9yeS5jcmVhdGVBbGJ1bShhbGJ1bSkudGhlbihhbGJ1bSA9PiB7XG4gICAgICAgICAgICBEaWFsb2dGYWN0b3J5LmRpc3BsYXkoXCJDcmVhdGVkXCIpO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgICRzY29wZS5hZGRQaG90b3MgPSAoYWxidW0pID0+IHtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGluZ1BpY3R1cmVzID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRBbGJ1bSA9IGFsYnVtO1xuICAgICAgICBQaG90b3NGYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgICAgIC50aGVuKHBob3RvcyA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnBob3RvcyA9IHBob3RvcztcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgICRzY29wZS52aWV3QWxidW0gPSAoYWxidW0pID0+IHtcblxuICAgIH1cblxuXG4gICAgJHNjb3BlLnVwZGF0ZUFsYnVtID0gKCkgPT4ge1xuICAgICAgICBBbGJ1bUZhY3RvcnkudXBkYXRlQWxidW0oJHNjb3BlLmN1cnJlbnRBbGJ1bSkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgRGlhbG9nRmFjdG9yeS5kaXNwbGF5KFwiVXBkYXRlZFwiLCAxNTAwKTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5yZWxvYWQoKTtcbiAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgICRzY29wZS52aWV3QWxidW0gPSAoYWxidW0pID0+IHtcbiAgICAgICAgJHN0YXRlLmdvKCdzaW5nbGVBbGJ1bScsIHthbGJ1bUlkOiBhbGJ1bS5faWR9KVxuICAgIH1cblxuICAgICRzY29wZS5hZGRUb0FsYnVtID0gKHBob3RvKSA9PiB7XG4gICAgICAgICRzY29wZS5jdXJyZW50QWxidW0ucGhvdG9zLnB1c2gocGhvdG8uX2lkKTtcbiAgICAgICAgRGlhbG9nRmFjdG9yeS5kaXNwbGF5KFwiQWRkZWRcIiwgMTAwMCk7XG4gICAgfVxuXG5cblxufSkiLCJhcHAuZmFjdG9yeSgnQWxidW1GYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBjcmVhdGVBbGJ1bTogKGFsYnVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9hbGJ1bXMvJywgYWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICBmZXRjaEFsbDogKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9hbGJ1bXMvJylcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlQWxidW06IChhbGJ1bSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvYWxidW1zL3VwZGF0ZScsIGFsYnVtKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICBmZXRjaE9uZTogKGFsYnVtSWQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvYWxidW1zLycrIGFsYnVtSWQpXG4gICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGZpbmRVc2VyQWxidW1zOiAodXNlcklkKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2FsYnVtcy91c2VyLycgKyB1c2VySWQpLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICBhZGRQaG90bzogKHBob3RvSWQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL2FsYnVtcy9waG90by8nICsgcGhvdG9JZClcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRlQWxidW06IChhbGJ1bUlkKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZGVsZXRlKCcvYXBpL2FsYnVtcy8nKyBhbGJ1bUlkKVxuICAgICAgICB9XG4gICAgfVxuXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FsYnVtJywge1xuICAgICAgICB1cmw6ICcvQWxidW0nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FsYnVtL2FsYnVtLmh0bWwnXG5cbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpbmdsZUFsYnVtJywge1xuICAgICAgICB1cmw6ICcvQWxidW0vOmFsYnVtSWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FsYnVtL3NpbmdsZS1hbGJ1bS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1NpbmdsZUFsYnVtQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhbGJ1bTogKEFsYnVtRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSA9PiB7XG4gICAgICAgIFx0XHRyZXR1cm4gQWxidW1GYWN0b3J5LmZldGNoT25lKCRzdGF0ZVBhcmFtcy5hbGJ1bUlkKVxuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgICAgXG4gICAgfSk7XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdBbGJ1bXNDdHJsJywgKCRzY29wZSwgJHN0YXRlLCBQaG90b3NGYWN0b3J5LCBBbGJ1bUZhY3RvcnksIFVzZXJGYWN0b3J5LCBEaWFsb2dGYWN0b3J5KSA9PiB7XG5cdEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgIC50aGVuKGFsYnVtcyA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtT25lID0gJHNjb3BlLmFsYnVtc1swXTtcbiAgICAgICAgfSk7XG5cbiAgICAkc2NvcGUudmlld0FsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgICAgICRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7YWxidW1JZDogYWxidW0uX2lkfSlcbiAgICB9XG5cbiAgICAkc2NvcGUuZm9sbG93QWxidW0gPSAoYWxidW0pID0+IHtcbiAgICBcdFVzZXJGYWN0b3J5LmZvbGxvd0FsYnVtKGFsYnVtKVxuICAgIH1cblxuICAgICRzY29wZS5jcmVhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgJHN0YXRlLmdvKCduZXdBbGJ1bScpO1xuICAgICAgICAvLyBsZXQgYWxidW0gPSB7XG4gICAgICAgIC8vICAgICB0aXRsZTogJHNjb3BlLm5ld0FsYnVtXG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gQWxidW1GYWN0b3J5LmNyZWF0ZUFsYnVtKGFsYnVtKS50aGVuKGFsYnVtID0+IHtcbiAgICAgICAgLy8gICAgIERpYWxvZ0ZhY3RvcnkuZGlzcGxheShcIkNyZWF0ZWRcIik7XG4gICAgICAgIC8vIH0pXG4gICAgfVxuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhbGJ1bXMnLCB7XG4gICAgICAgIHVybDogJy9hbGJ1bXMnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FsYnVtL2FsYnVtcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0FsYnVtc0N0cmwnXG4gICAgfSk7XG59KTsiLCJhcHAuY29uZmlnKCgkc3RhdGVQcm92aWRlcikgPT4ge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnZWRpdEFsYnVtJywge1xuXHRcdHVybDogJy9lZGl0QWxidW0vOmFsYnVtSWQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvYWxidW0vZWRpdC1hbGJ1bS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnRWRpdEFsYnVtQ3RybCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0YWxidW06IChBbGJ1bUZhY3RvcnksICRzdGF0ZVBhcmFtcykgPT4ge1xuXHRcdFx0XHRyZXR1cm4gQWxidW1GYWN0b3J5LmZldGNoT25lKCRzdGF0ZVBhcmFtcy5hbGJ1bUlkKVxuXHRcdFx0fVxuXHRcdH1cblx0fSlcbn0pO1xuXG5cbmFwcC5jb250cm9sbGVyKCdFZGl0QWxidW1DdHJsJywgKCRzY29wZSwgQWxidW1GYWN0b3J5LCBQaG90b3NGYWN0b3J5LCBEaWFsb2dGYWN0b3J5LCBhbGJ1bSkgPT4ge1xuXHQkc2NvcGUuYWRkaW5nUGljdHVyZXMgPSBmYWxzZTtcblxuXHRsZXQgc2V0RGF0ZSA9ICgpID0+IHtcblx0XHRhbGJ1bS5kYXRlID0gbmV3IERhdGUoYWxidW0uZGF0ZSk7XG5cdFx0JHNjb3BlLmFsYnVtID0gYWxidW07XG5cdH1cblx0c2V0RGF0ZSgpO1xuXG5cdCRzY29wZS5zYXZlQWxidW0gPSgpID0+IHtcblx0XHRBbGJ1bUZhY3RvcnkudXBkYXRlQWxidW0oJHNjb3BlLmFsYnVtKVxuXHRcdC50aGVuKHJlcyA9PiB7XG5cdFx0XHQkc2NvcGUuYWxidW0gPSByZXM7XG5cdFx0XHQkc2NvcGUuc2VsZWN0aW5nUGljdHVyZXMgPSBmYWxzZTtcblx0XHRcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheSgnU2F2ZWQnLCAxMDAwKTtcblx0XHR9KVxuXHR9XG5cblx0JHNjb3BlLmFkZFBob3RvcyA9ICgpID0+IHtcblx0XHRjb25zb2xlLmxvZygnYWRkaW5nJyk7XG5cdFx0UGhvdG9zRmFjdG9yeS5mZXRjaEFsbCgpLnRoZW4ocGhvdG9zID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdwaG90b3MnLCBwaG90b3MpO1xuXHRcdFx0JHNjb3BlLnNlbGVjdGluZ1BpY3R1cmVzID0gdHJ1ZTtcblx0XHRcdCRzY29wZS5waG90b3MgPSBwaG90b3M7XG5cdFx0fSlcblx0fVxuXG5cdCRzY29wZS5hZGRUb0FsYnVtID0gKHBob3RvKSA9PiB7XG4gICAgICAgICRzY29wZS5hbGJ1bS5waG90b3MucHVzaChwaG90by5faWQpO1xuICAgIH1cbn0pIiwiYXBwLmNvbnRyb2xsZXIoJ05ld0FsYnVtQ3RybCcsICgkc2NvcGUsICRzdGF0ZSwgQWxidW1GYWN0b3J5LCBQaG90b3NGYWN0b3J5LCBTZXNzaW9uLCBEaWFsb2dGYWN0b3J5LCBBdXRoU2VydmljZSkgPT4ge1xuXHRjb25zb2xlLmxvZygnU2Vzc2lvbicsIFNlc3Npb24pO1xuXHQkc2NvcGUuc2hvd1Bob3RvcyA9IGZhbHNlO1xuXG5cdCRzY29wZS5jcmVhdGVBbGJ1bSA9ICgpID0+IHtcblx0XHQkc2NvcGUuYWxidW0ub3duZXIgPSBTZXNzaW9uLnVzZXIuX2lkO1xuXHRcdGNvbnNvbGUubG9nKCRzY29wZS5hbGJ1bSk7XG4gICAgICAgIEFsYnVtRmFjdG9yeS5jcmVhdGVBbGJ1bSgkc2NvcGUuYWxidW0pLnRoZW4oYWxidW0gPT4ge1xuICAgICAgICBcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheShcIkNyZWF0ZWRcIiwgMTAwMCk7XG4gICAgICAgIFx0JHNjb3BlLmFsYnVtID0gYWxidW07XG4gICAgICAgIFx0cmV0dXJuIFBob3Rvc0ZhY3RvcnkuZmV0Y2hBbGwoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4ocGhvdG9zID0+IHtcbiAgICAgICAgXHRjb25zb2xlLmxvZyhwaG90b3MpO1xuICAgICAgICBcdCRzY29wZS5waG90b3MgPSBwaG90b3M7XG4gICAgICAgIFx0JHNjb3BlLnNob3dQaG90b3MgPSB0cnVlO1xuICAgICAgICB9KVxuICAgIH1cblxuXG5cbiAgICAkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuICAgIFx0RGlhbG9nRmFjdG9yeS5kaXNwbGF5KCdBZGRlZCcsIDc1MCk7XG4gICAgICAgICRzY29wZS5hbGJ1bS5waG90b3MucHVzaChwaG90byk7XG4gICAgICAgICRzY29wZS5hbGJ1bS5jb3ZlciA9IHBob3RvO1xuICAgIH1cblxuICAgICRzY29wZS5zYXZlQWxidW0gPSAoKSA9PiB7XG4gICAgXHRBbGJ1bUZhY3RvcnkudXBkYXRlQWxidW0oJHNjb3BlLmFsYnVtKS50aGVuKGFsYnVtID0+IHtcbiAgICBcdFx0JHN0YXRlLmdvKCdhbGJ1bXMnKTtcbiAgICBcdH0pXG4gICAgfVxufSk7IiwiYXBwLmNvbmZpZygoJHN0YXRlUHJvdmlkZXIpID0+IHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ25ld0FsYnVtJywge1xuXHRcdHVybDogJy9uZXdBbGJ1bScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9hbGJ1bS9uZXctYWxidW0uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ05ld0FsYnVtQ3RybCdcblx0fSlcbn0pO1xuXG4iLCJhcHAuY29udHJvbGxlcignU2luZ2xlQWxidW1DdHJsJywgKCRzY29wZSwgJHRpbWVvdXQsICRzdGF0ZSwgYWxidW0sIEFkbWluRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBQaG90b3NGYWN0b3J5KSA9PiB7XG5cdCRzY29wZS5hbGJ1bSA9IGFsYnVtO1xuXHQkc2NvcGUuc2VsZWN0aW5nQ292ZXIgPSBmYWxzZTtcblx0JHNjb3BlLmNoYW5nZXNNYWRlID0gZmFsc2U7XG5cdCRzY29wZS5yZW1vdmVQaG90b3MgPSBmYWxzZTtcblx0JHNjb3BlLnJlbW92ZUZyb21BbGJ1bSA9IChwaG90bykgPT4ge1xuXHRcdGxldCBwaG90b0luZGV4ID0gJHNjb3BlLmFsYnVtLnBob3Rvcy5pbmRleE9mKHBob3RvKTtcblx0XHQkc2NvcGUuYWxidW0ucGhvdG9zLnNwbGljZShwaG90b0luZGV4LCAxKTtcblx0fVxuXG5cdCRzY29wZS5kZWxldGVQaG90b3MgPSAoKSA9PiB7XG5cdFx0JHNjb3BlLnJlbW92ZVBob3RvcyA9IHRydWU7XG5cdH1cblxuXHQkc2NvcGUuc2VsZWN0Q292ZXIgPSAoKSA9PiB7XG5cdFx0JHRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0JHNjb3BlLnNlbGVjdGluZ0NvdmVyID0gdHJ1ZTtcblx0XHRcdCRzY29wZS5jaGFuZ2VzTWFkZSA9IHRydWU7XG5cdFx0fSwgNTAwKTtcblx0fVxuXG5cdCRzY29wZS5hZGRDb3ZlciA9IChwaG90bykgPT4ge1xuICAgICAgICAkc2NvcGUuYWxidW0uY292ZXIgPSBwaG90by5faWQ7XG4gICAgICAgICRzY29wZS5zZWxlY3RpbmdDb3ZlciA9IGZhbHNlO1xuICAgIH1cblxuXHQkc2NvcGUudXBkYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgIEFsYnVtRmFjdG9yeS51cGRhdGVBbGJ1bSgkc2NvcGUuYWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnYWRtaW4nKTtcbiAgICAgICAgfSlcbiAgICB9XG59KTsiLCJhcHAuY29udHJvbGxlcignQ2FsZW5kYXJDdHJsJywgKCRzY29wZSwgVXNlckZhY3RvcnksIEF1dGhTZXJ2aWNlKSA9PiB7XG5cbn0pOyIsImFwcC5jb25maWcoKCRzdGF0ZVByb3ZpZGVyKSA9PiB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjYWxlbmRhcicsIHtcblx0XHR1cmw6ICcvY2FsZW5kYXInLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY2FsZW5kYXIvY2FsZW5kYXIuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0NhbGVuZGFyQ3RybCdcblx0fSlcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJy9qcy9ob21lL2hvbWUuaHRtbCdcbiAgICAgICAgXG4gICAgfSk7XG59KTsiLCJhcHAuY29uZmlnKCgkc3RhdGVQcm92aWRlcikgPT4ge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnbGF5b3V0Jywge1xuXHRcdHVybDogJy9sYXlvdXQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvbGF5b3V0L2xheW91dC5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnTGF5b3V0Q3RybCcsXG5cdFx0cmVzb2x2ZToge1xuICAgICAgICBcdGFsYnVtczogKEFsYnVtRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSA9PiB7XG4gICAgICAgIFx0XHRyZXR1cm4gQWxidW1GYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgXHR9XG4gICAgICAgIH1cblx0fSlcbn0pO1xuXG5cbmFwcC5jb250cm9sbGVyKCdMYXlvdXRDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBQaG90b3NGYWN0b3J5LCBhbGJ1bXMpIHtcblx0Y29uc29sZS5sb2coXCJhbGwgYWxidW1zXCIsIGFsYnVtcyk7XG5cdCRzY29wZS5hbGJ1bXMgPSBhbGJ1bXM7XG5cdCRzY29wZS5nZXRGaWxlcyA9ICgpID0+IHtcblx0XHRjb25zb2xlLmxvZyhcImdldHRpbmcgRmlsZXNcIik7XG5cdFx0UGhvdG9zRmFjdG9yeS5nZXRGaWxlcygpO1xuXHR9XG59KTsiLCJhcHAuY29udHJvbGxlcignUGhvdG9DdHJsJywgKCRzY29wZSwgJHN0YXRlLCBQaG90b3NGYWN0b3J5LCBBbGJ1bUZhY3RvcnksIFVzZXJGYWN0b3J5LCBwaG90b3MpID0+IHtcbiAgICBsZXQgYWxidW1BcnJheSA9IFtdO1xuICAgICRzY29wZS50aXRsZSA9IFwiV2VsY29tZVwiO1xuICAgICRzY29wZS5waG90b3NHb3QgPSBmYWxzZTtcbiAgICAkc2NvcGUudXBsb2FkUGFnZSA9ICgpID0+IHtcbiAgICAgICAgJHN0YXRlLmdvKCdhZGRwaG90bycpO1xuICAgIH1cblxuICAgIC8vIEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgLy8gICAgIC50aGVuKGFsYnVtcyA9PiB7XG4gICAgLy8gICAgICAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgIC8vICAgICB9KVxuICAgIC8vIFBob3Rvc0ZhY3RvcnkuZmV0Y2hBbGwoKS50aGVuKHBob3RvcyA9PiB7XG4gICAgLy8gICAgICRzY29wZS5waG90b3MgPSBwaG90b3M7XG4gICAgLy8gfSlcbiAgICBjb25zb2xlLmxvZyhwaG90b3MpO1xuXG4gICAgJHNjb3BlLnBob3RvcyA9IHBob3Rvc1xuXG4gICAgJHNjb3BlLmFkZFBob3RvcyA9ICgpID0+IHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gNDQ7IGkrKykge1xuICAgICAgICAgICAgbGV0IHNyYyA9ICcvaW1hZ2UvSU1HXycgKyBpICsgJy5qcGcnO1xuICAgICAgICAgICAgUGhvdG9zRmFjdG9yeS5hZGRQaG90byhzcmMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgJHNjb3BlLmZldGNoQWxsID0gKCkgPT4ge1xuICAgICAgICBQaG90b3NGYWN0b3J5LmZldGNoQWxsKCkudGhlbihwaG90b3MgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLnBob3RvcyA9IHBob3RvcztcbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgICRzY29wZS5jcmVhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgJHNjb3BlLm5ld0FsYnVtID0ge1xuICAgICAgICAgICAgdGl0bGU6ICRzY29wZS5hbGJ1bU5hbWUsXG4gICAgICAgICAgICBwaG90b3M6IFsnaW1hZ2UvSU1HXzEuanBnJ11cbiAgICAgICAgfVxuICAgICAgICBQaG90b3NGYWN0b3J5LmNyZWF0ZUFsYnVtKCRzY29wZS5uZXdBbGJ1bSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmdldEFsYnVtcyA9ICgpID0+IHtcbiAgICAgICAgUGhvdG9zRmFjdG9yeS5mZXRjaEFsYnVtcygpXG4gICAgICAgICAgICAudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS5hbGJ1bXMgPSBhbGJ1bXM7XG4gICAgICAgICAgICB9KVxuICAgIH1cblxuICAgICRzY29wZS5hZGRUb0FsYnVtID0gKHBob3RvKSA9PiB7XG4gICAgICAgIGFsYnVtQXJyYXkucHVzaChwaG90byk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnNhdmVBbGJ1bSA9ICgpID0+IHtcbiAgICB9XG5cbiAgICAkc2NvcGUuZm9sbG93UGhvdG8gPSAocGhvdG8pID0+IHtcbiAgICAgICAgVXNlckZhY3RvcnkuZm9sbG93UGhvdG8ocGhvdG8pXG4gICAgfVxuXG4gICBcblxuXG5cblxufSk7IiwiYXBwLmZhY3RvcnkoJ1Bob3Rvc0ZhY3RvcnknLCAoJGh0dHApID0+IHtcblx0cmV0dXJuIHtcblx0XHRhZGRQaG90bzogKHNyYykgPT4ge1xuXHRcdFx0bGV0IHBob3RvID0ge1xuXHRcdFx0XHRzcmM6IHNyYyxcblx0XHRcdFx0bmFtZTogJ3Rlc3QnXG5cdFx0XHR9XG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpL3Bob3Rvcy9hZGQnLCBwaG90bylcblx0XHRcdC50aGVuKHJlcyA9PiB7XG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0c2F2ZVBob3RvOiAocGhvdG8pID0+IHtcblx0XHRcdCRodHRwLnBvc3QoJy9hcGkvcGhvdG9zL3VwZGF0ZScsIHBob3RvKS50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHJlcy5kYXRhKTtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRmZXRjaEFsbDogKCkgPT4ge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9waG90b3MnKVxuXHRcdFx0LnRoZW4ocmVzID0+IHtcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGZldGNoVGVuOiAoKSA9PiB7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Bob3Rvcy9saW1pdDEwJylcblx0XHRcdC50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRnZXRGaWxlczogKCkgPT4ge1xuXHRcdFx0JGh0dHAuZ2V0KCcvYXBpL2dldEZpbGVzL2FsYnVtQScpXG5cdFx0XHQudGhlbihyZXMgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIlJldHVybmVkOiBcIiwgcmVzLmRhdGEpO1xuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pOyIsImFwcC5jb250cm9sbGVyKCdVcGxvYWRQaG90b0N0cmwnLCAoJHNjb3BlLCAkc3RhdGUsIFBob3Rvc0ZhY3RvcnksIEFsYnVtRmFjdG9yeSwgRmlsZVVwbG9hZGVyKSA9PiB7XG5cdEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpLnRoZW4oYWxidW1zID0+IHtcbiAgICAgICAgJHNjb3BlLmFsYnVtcyA9IGFsYnVtcztcbiAgICB9KVxuXG4gICAgJHNjb3BlLmNyZWF0ZUFsYnVtID0gKCkgPT4ge1xuICAgICAgICBsZXQgYWxidW0gPSB7XG4gICAgICAgICAgICB0aXRsZTogJHNjb3BlLm5ld0FsYnVtXG4gICAgICAgIH1cbiAgICAgICAgQWxidW1GYWN0b3J5LmNyZWF0ZUFsYnVtKGFsYnVtKS50aGVuKGFsYnVtID0+IHtcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bXMucHVzaChhbGJ1bSk7XG4gICAgICAgICAgICAkc2NvcGUucGhvdG9BbGJ1bSA9IGFsYnVtLl9pZDtcbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgIHZhciB1cGxvYWRlciA9ICRzY29wZS51cGxvYWRlciA9IG5ldyBGaWxlVXBsb2FkZXIoe1xuICAgICAgICAgICAgIHVybDogJy9hcGkvcGhvdG9zL3VwbG9hZEFXUydcbiAgICAgICAgfSk7XG4gICAgICAgIHVwbG9hZGVyLmZpbHRlcnMucHVzaCh7XG4gICAgICAgICAgICBuYW1lOiAnaW1hZ2VGaWx0ZXInLFxuICAgICAgICAgICAgZm46IGZ1bmN0aW9uKGl0ZW0gLyp7RmlsZXxGaWxlTGlrZU9iamVjdH0qLyAsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgdHlwZSA9ICd8JyArIGl0ZW0udHlwZS5zbGljZShpdGVtLnR5cGUubGFzdEluZGV4T2YoJy8nKSArIDEpICsgJ3wnO1xuICAgICAgICAgICAgICAgIHJldHVybiAnfGpwZ3xwbmd8anBlZ3xibXB8Z2lmfCcuaW5kZXhPZih0eXBlKSAhPT0gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgY291bnQgPSAxO1xuICAgICAgICB1cGxvYWRlci5vbldoZW5BZGRpbmdGaWxlRmFpbGVkID0gZnVuY3Rpb24oaXRlbSAvKntGaWxlfEZpbGVMaWtlT2JqZWN0fSovICwgZmlsdGVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oJ29uV2hlbkFkZGluZ0ZpbGVGYWlsZWQnLCBpdGVtLCBmaWx0ZXIsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB1cGxvYWRlci5vbkFmdGVyQWRkaW5nRmlsZSA9IGZ1bmN0aW9uKGZpbGVJdGVtKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmluZm8oJ29uQWZ0ZXJBZGRpbmdGaWxlJywgZmlsZUl0ZW0pO1xuICAgICAgICAgICAgbGV0IHBob3RvSW5mbyA9IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJHNjb3BlLnRpdGxlICsgJy0nICsgY291bnQsXG4gICAgICAgICAgICAgICAgYWxidW06ICRzY29wZS5waG90b0FsYnVtXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaWxlSXRlbS5mb3JtRGF0YS5wdXNoKHBob3RvSW5mbyk7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2ZpbGUnLCBmaWxlSXRlbSk7XG4gICAgICAgIH07XG4gICAgICAgIHVwbG9hZGVyLm9uQWZ0ZXJBZGRpbmdBbGwgPSBmdW5jdGlvbihhZGRlZEZpbGVJdGVtcykge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKCdvbkFmdGVyQWRkaW5nQWxsJywgYWRkZWRGaWxlSXRlbXMpO1xuICAgICAgICB9O1xuICAgICAgICB1cGxvYWRlci5vbkJlZm9yZVVwbG9hZEl0ZW0gPSBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oJ29uQmVmb3JlVXBsb2FkSXRlbScsIGl0ZW0pO1xuICAgICAgICB9O1xuICAgICAgICB1cGxvYWRlci5vblByb2dyZXNzSXRlbSA9IGZ1bmN0aW9uKGZpbGVJdGVtLCBwcm9ncmVzcykge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKCdvblByb2dyZXNzSXRlbScsIGZpbGVJdGVtLCBwcm9ncmVzcyk7XG4gICAgICAgIH07XG4gICAgICAgIHVwbG9hZGVyLm9uUHJvZ3Jlc3NBbGwgPSBmdW5jdGlvbihwcm9ncmVzcykge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKCdvblByb2dyZXNzQWxsJywgcHJvZ3Jlc3MpO1xuICAgICAgICB9O1xuICAgICAgICB1cGxvYWRlci5vblN1Y2Nlc3NJdGVtID0gZnVuY3Rpb24oZmlsZUl0ZW0sIHJlc3BvbnNlLCBzdGF0dXMsIGhlYWRlcnMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnb25TdWNjZXNzSXRlbScsIGZpbGVJdGVtLCByZXNwb25zZSwgc3RhdHVzLCBoZWFkZXJzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdXBsb2FkZXIub25FcnJvckl0ZW0gPSBmdW5jdGlvbihmaWxlSXRlbSwgcmVzcG9uc2UsIHN0YXR1cywgaGVhZGVycykge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKCdvbkVycm9ySXRlbScsIGZpbGVJdGVtLCByZXNwb25zZSwgc3RhdHVzLCBoZWFkZXJzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdXBsb2FkZXIub25DYW5jZWxJdGVtID0gZnVuY3Rpb24oZmlsZUl0ZW0sIHJlc3BvbnNlLCBzdGF0dXMsIGhlYWRlcnMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnb25DYW5jZWxJdGVtJywgZmlsZUl0ZW0sIHJlc3BvbnNlLCBzdGF0dXMsIGhlYWRlcnMpO1xuICAgICAgICB9O1xuICAgICAgICB1cGxvYWRlci5vbkNvbXBsZXRlSXRlbSA9IGZ1bmN0aW9uKGZpbGVJdGVtLCByZXNwb25zZSwgc3RhdHVzLCBoZWFkZXJzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oJ29uQ29tcGxldGVJdGVtJywgZmlsZUl0ZW0sIHJlc3BvbnNlLCBzdGF0dXMsIGhlYWRlcnMpO1xuICAgICAgICB9O1xuICAgICAgICB1cGxvYWRlci5vbkNvbXBsZXRlQWxsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oJ29uQ29tcGxldGVBbGwnKTtcbiAgICAgICAgICAgIC8vICRzY29wZS5maW5pc2goKTtcbiAgICAgICAgfTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Bob3RvcycsIHtcbiAgICAgICAgdXJsOiAnL3Bob3RvcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcGhvdG9zL3Bob3Rvcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1Bob3RvQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgIHBob3RvczogKFBob3Rvc0ZhY3RvcnksICRzdGF0ZVBhcmFtcykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBQaG90b3NGYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkZHBob3RvJywge1xuICAgICAgICB1cmw6ICcvcGhvdG9zJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9waG90b3MvcGhvdG9zLWFkZC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1Bob3RvQ3RybCdcbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VwbG9hZFBob3RvcycsIHtcbiAgICAgICAgdXJsOiAnL3VwbG9hZCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcGhvdG9zL3Bob3Rvcy11cGxvYWQuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdVcGxvYWRQaG90b0N0cmwnXG4gICAgfSk7XG59KTtcblxuIiwiYXBwLmNvbnRyb2xsZXIoJ1NpZ251cEN0cmwnLCAoJHNjb3BlLCAkcm9vdFNjb3BlLCBVc2VyRmFjdG9yeSkgPT4ge1xuXHQkc2NvcGUudXNlciA9IHt9O1xuXHQkc2NvcGUuc3VibWl0ID0gKCkgPT4ge1xuXHRcdFVzZXJGYWN0b3J5LmNyZWF0ZVVzZXIoJHNjb3BlLnVzZXIpXG5cdFx0LnRoZW4odXNlciA9PiB7XG5cdFx0XHQkcm9vdFNjb3BlLnVzZXIgPSB1c2VyO1xuXHRcdH0pXG5cdH1cbn0pOyIsImFwcC5jb25maWcoKCRzdGF0ZVByb3ZpZGVyKSA9PiB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zaWdudXAvc2lnbnVwLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDdHJsJ1xuXHR9KVxufSk7IiwiYXBwLmZhY3RvcnkoJ0RpYWxvZ0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJG1kRGlhbG9nLCAkdGltZW91dCkgeyBcblx0XG5cblx0bGV0IHNob3dEaWFsb2cgPSAobWVzc2FnZSkgPT4ge1xuXHRcdHZhciBwYXJlbnRFbCA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KTtcbiAgICAgICAkbWREaWFsb2cuc2hvdyh7XG4gICAgICAgICBwYXJlbnQ6IHBhcmVudEVsLFxuICAgICAgICAgdGVtcGxhdGU6XG4gICAgICAgICAgICc8bWQtZGlhbG9nIGFyaWEtbGFiZWw9XCJMaXN0IGRpYWxvZ1wiIGlkPVwiZGlhbG9nXCI+JyArXG4gICAgICAgICAgICcgIDxtZC1kaWFsb2ctY29udGVudD4nK1xuICAgICAgICAgICBcdG1lc3NhZ2UgK1xuICAgICAgICAgICAnICA8L21kLWRpYWxvZy1jb250ZW50PicgK1xuICAgICAgICAgICAnPC9tZC1kaWFsb2c+J1xuICAgICAgfSk7XG5cdH1cblxuXG5cdHJldHVybiB7XG5cdFx0ZGlzcGxheTogKG1lc3NhZ2UsIHRpbWVvdXQpID0+IHtcblx0XHRcdHNob3dEaWFsb2cobWVzc2FnZSk7XG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0JG1kRGlhbG9nLmhpZGUoKTtcblx0XHRcdH0sIHRpbWVvdXQpXG5cdFx0fVxuXHR9XG5cblxuXG59KTsiLCJhcHAuZGlyZWN0aXZlKCd6dFNldFNpemUnLCBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdGxpbms6IChzY29wZSwgZWxlbWVudCwgYXR0cikgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coXCJhdHRyaWJ1dGVzOiBcIiwgZWxlbWVudFswXS5jbGllbnRXaWR0aCk7XG5cdFx0XHRsZXQgd2lkdGggPSAoZWxlbWVudFswXS5jbGllbnRXaWR0aCAqIDAuNjYpICsgJ3B4Jztcblx0XHRcdGVsZW1lbnQuY3NzKHtcblx0XHRcdFx0aGVpZ2h0OiB3aWR0aFxuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pOyIsImFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsICgkaHR0cCwgJHJvb3RTY29wZSwgRGlhbG9nRmFjdG9yeSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdGN1cnJlbnRVc2VyOiAoKSA9PiB7XG5cdFx0XHRsZXQgdXNlciA9IHtcblx0XHRcdFx0bmFtZTogJ0RhbmUnLFxuXHRcdFx0XHRwaWN0dXJlOiAnU29tZXRoaW5nJyxcblx0XHRcdFx0YWxidW1zOiBbJ09uZScsICdUd28nLCAnVGhyZWUnXVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHVzZXJcblx0XHRcdC8vc2VuZCByZXF1ZXN0IGZvciBjdXJyZW50IGxvZ2dlZC1pbiB1c2VyXG5cdFx0fSxcblx0XHRjcmVhdGVVc2VyOiAodXNlcikgPT4ge1xuXHRcdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlcnMvJywgdXNlcikudGhlbihyZXMgPT4ge1xuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0Z2V0VXNlcjogKCkgPT4ge1xuXHRcdFx0bGV0IHVzZXJuYW1lID0gJ2RhbmV0b21zZXRoJztcblx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlcnMvJysgdXNlcm5hbWUpLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0JHJvb3RTY29wZS51c2VyID0gcmVzLmRhdGFcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdC8vVXNlciBzZXR0aW5nc1xuXHRcdC8vIGZvbGxvd0FsYnVtOiAoYWxidW1JZCkgPT4ge1xuXHRcdC8vIFx0bGV0IGJvZHkgPSB7XG5cdFx0Ly8gXHRcdGFsYnVtSWQ6IGFsYnVtSWQsXG5cdFx0Ly8gXHRcdHVzZXJJZDogJHJvb3RTY29wZS51c2VyLl9pZFxuXHRcdC8vIFx0fVxuXHRcdC8vIFx0JGh0dHAucG9zdCgnL2FwaS91c2Vycy9hbGJ1bScsIGJvZHkpLnRoZW4ocmVzID0+IHtcblx0XHQvLyBcdFx0aWYocmVzLnN0YXR1cyA9PT0gMjAwKSB7XG5cdFx0Ly8gXHRcdFx0RGlhbG9nRmFjdG9yeS5kaXNwbGF5KCdBZGRlZCBUbyBBbGJ1bXMnLCAxMDAwKVxuXHRcdC8vIFx0XHR9XG5cdFx0Ly8gXHRcdGVsc2Uge1xuXHRcdC8vIFx0XHRcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheSgnU3RhdHVzIG5vdCAyMDAnLCAxMDAwKVxuXHRcdC8vIFx0XHR9XG5cdFx0Ly8gXHR9KVxuXHRcdC8vIH1cblx0XHRmb2xsb3dBbGJ1bTogKGFsYnVtKSA9PiB7XG5cdFx0XHRsZXQgdXNlciA9ICRyb290U2NvcGUudXNlclxuXHRcdFx0aWYodXNlci5hbGJ1bXMuaW5kZXhPZigpICE9PSAtMSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnYWxidW0gYWxyZWFkeSBleGlzdHMnKTtcblx0XHRcdH1cblx0XHRcdHVzZXIuYWxidW1zLnB1c2goYWxidW0pO1xuXG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpL3VzZXJzL3VwZGF0ZScsIHVzZXIpLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0aWYocmVzLnN0YXR1cyA9PT0gMjAwKSB7XG5cdFx0XHRcdFx0RGlhbG9nRmFjdG9yeS5kaXNwbGF5KCdBZGRlZCBUbyBBbGJ1bXMnLCAxMDAwKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheSgnU3RhdHVzIG5vdCAyMDAnLCAxMDAwKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0Zm9sbG93UGhvdG86IChwaG90bykgPT4ge1xuXHRcdFx0bGV0IHVzZXIgPSAkcm9vdFNjb3BlLnVzZXJcblx0XHRcdGlmKHVzZXIucGhvdG9zLmluZGV4T2YoKSAhPT0gLTEpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ1Bob3RvIGFscmVhZHkgZXhpc3RzJyk7XG5cdFx0XHR9XG5cdFx0XHR1c2VyLnBob3Rvcy5wdXNoKHBob3RvKTtcblxuXHRcdFx0JGh0dHAucG9zdCgnL2FwaS91c2Vycy91cGRhdGUnLCB1c2VyKS50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdGlmKHJlcy5zdGF0dXMgPT09IDIwMCkge1xuXHRcdFx0XHRcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheSgnQWRkZWQgVG8gUGhvdG9zJywgMTAwMClcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHREaWFsb2dGYWN0b3J5LmRpc3BsYXkoJ1N0YXR1cyBub3QgMjAwJywgMTAwMClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2FsYnVtQ2FyZCcsICgkcm9vdFNjb3BlLCAkc3RhdGUpID0+IHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdGNvbnRyb2xsZXI6ICdBbGJ1bXNDdHJsJyxcblx0XHRzY29wZToge1xuXHRcdFx0YWxidW06ICc9J1xuXHRcdH0sXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9hbGJ1bXMvYWxidW0tY2FyZC5odG1sJyxcblx0XHRsaW5rOiAoc2NvcGUpID0+IHtcblx0XHRcdHNjb3BlLmVkaXRBbGJ1bSA9ICgpID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coc2NvcGUuYWxidW0uY292ZXIudGh1bWJTcmMpO1xuXHRcdFx0XHQvLyAkc3RhdGUuZ28oJ2VkaXRBbGJ1bScsIHthbGJ1bUlkOiBzY29wZS5hbGJ1bS5faWR9KTtcblx0XHRcdH1cblxuXHRcdFx0c2NvcGUudmlld0FsYnVtID0gKCkgPT4ge1xuXHRcdFx0XHQkc3RhdGUuZ28oJ3NpbmdsZUFsYnVtJywge2FsYnVtSWQ6IHNjb3BlLmFsYnVtLl9pZH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRzY29wZS5hZGRUb0Zhdm9yaXRlcyA9ICgpID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJjYWxsIHVzZXIgaGVyZVwiKTtcblx0XHRcdH1cblx0fVxufVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc2VsZWN0QWxidW0nLCAoJHJvb3RTY29wZSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0Y29udHJvbGxlcjogJ0FsYnVtc0N0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvYWxidW1zL2FsYnVtLmh0bWwnLFxuXHRcdGxpbms6IChzY29wZSkgPT4ge1xuXG5cdH1cbn1cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ3VzZXJBbGJ1bXMnLCAoJHJvb3RTY29wZSwgJHN0YXRlKSA9PiB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2FsYnVtcy91c2VyLWFsYnVtcy5odG1sJyxcblx0XHRsaW5rOiAoc2NvcGUpID0+IHtcblx0XHRcdHNjb3BlLmVkaXRBbGJ1bSA9ICgpID0+IHtcblx0XHRcdFx0JHN0YXRlLmdvKCdlZGl0QWxidW0nLCB7YWxidW1JZDogc2NvcGUuYWxidW0uX2lkfSk7XG5cdFx0XHR9XG5cblx0XHRcdHNjb3BlLmFkZFRvRmF2b3JpdGVzID0gKCkgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcImNhbGwgdXNlciBoZXJlXCIpO1xuXHRcdFx0fVxuXHR9XG59XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdiYW5uZXInLCAoJHJvb3RTY29wZSwgJHN0YXRlLCBTZXNzaW9uLCBVc2VyRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBBdXRoU2VydmljZSkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvYmFubmVyL2Jhbm5lci5odG1sJyxcbiAgICAgICAgbGluazogKHNjb3BlKSA9PiB7XG4gICAgICAgICAgICAvLyBVc2VyRmFjdG9yeS5nZXRVc2VyKCkudGhlbih1c2VyID0+IHtcbiAgICAgICAgICAgIC8vICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gQWxidW1GYWN0b3J5LmZpbmRVc2VyQWxidW1zKHVzZXIuX2lkKVxuICAgICAgICAgICAgLy8gfSkudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHNjb3BlLnVzZXIuYWxidW1zLnB1c2goYWxidW1zKTtcbiAgICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhzY29wZS51c2VyLmFsYnVtcyk7XG4gICAgICAgICAgICAvLyB9KVxuXG4gICAgICAgICAgICBVc2VyRmFjdG9yeS5nZXRVc2VyKCkudGhlbih1c2VyID0+IHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzY29wZS51c2VyKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBBbGJ1bUZhY3RvcnkuZmluZFVzZXJBbGJ1bXModXNlci5faWQpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oYWxidW1zID0+IHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyQWxidW1zID0gYWxidW1zO1xuICAgICAgICAgICAgICAgIGlmKHNjb3BlLnVzZXIuYWxidW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyQWxidW1zLnB1c2goc2NvcGUudXNlci5hbGJ1bXMpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNjb3BlLnVzZXJBbGJ1bXMpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLy8gQWxidW1GYWN0b3J5LmZpbmRVc2VyQWxidW1zKFNlc3Npb24udXNlci5faWQpXG4gICAgICAgICAgICAvLyAudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHNjb3BlLnVzZXJBbGJ1bXMgPSBhbGJ1bXM7XG4gICAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2coc2NvcGUudXNlckFsYnVtcyk7XG4gICAgICAgICAgICAvLyB9KVxuXG4gICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKHVzZXIgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3Q6ICdHdWVzdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0OiAnJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHNjb3BlLnNob3dBbGJ1bXMgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnNob3dQaWN0dXJlcyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBzY29wZS5hZGRBbGJ1bXMgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2NvcGUuc2hvd0FsYnVtcyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjb3BlLmFkZFBpY3R1cmVzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNjb3BlLnNob3dQaWN0dXJlcyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjb3BlLnZpZXdBbGJ1bSA9IChhbGJ1bSkgPT4ge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7XG4gICAgICAgICAgICAgICAgICAgIGFsYnVtSWQ6IGFsYnVtLl9pZFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH1cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUpIHtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmN1cnJlbnRQYWdlID0gdG9TdGF0ZS5uYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIClcblxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbe1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnSG9tZScsXG4gICAgICAgICAgICAgICAgc3RhdGU6ICdob21lJ1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnUGhvdG9zJyxcbiAgICAgICAgICAgICAgICBzdGF0ZTogJ3Bob3RvcydcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ0FsYnVtcycsXG4gICAgICAgICAgICAgICAgc3RhdGU6ICdhbGJ1bXMnXG4gICAgICAgICAgICB9LCBcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ1NjaGVkdWxlJyxcbiAgICAgICAgICAgICAgICBzdGF0ZTogJ2NhbGVuZGFyJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ0FkbWluJyxcbiAgICAgICAgICAgICAgICBzdGF0ZTogJ2FkbWluJ1xuICAgICAgICAgICAgfV07XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmV3QWxidW1TZWxlY3QnLCAoJHJvb3RTY29wZSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0Y29udHJvbGxlcjogJ05ld0FsYnVtQ3RybCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9waG90by9uZXctYWxidW0tc2VsZWN0Lmh0bWwnLFxuXHRcdGxpbms6IChzY29wZSkgPT4ge1xuXHR9XG59XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdwaG90b0VkaXQnLCAoUGhvdG9zRmFjdG9yeSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9waG90by9waG90by1lZGl0Lmh0bWwnLFxuXHRcdGxpbms6IChzY29wZSwgZWxlbSwgYXR0cikgPT4ge1xuXHRcdFx0c2NvcGUuc2F2ZVBob3RvID0gKCkgPT4ge1xuXHRcdFx0XHRQaG90b3NGYWN0b3J5LnNhdmVQaG90byhzY29wZS5waG90bylcblx0XHRcdH1cblx0XHR9XG5cdH1cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ3Bob3RvR3JpZCcsICgkcm9vdFNjb3BlKSA9PiB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHRzY29wZToge1xuXHRcdFx0Z3JpZFBob3RvczogJz1waG90b3MnXG5cdFx0fSxcblx0XHRjb250cm9sbGVyOiAnUGhvdG9DdHJsJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3Bob3RvL3Bob3RvLWdyaWQuaHRtbCcsXG5cdFx0bGluazogKHNjb3BlKSA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhzY29wZS5ncmlkUGhvdG9zKTtcblx0fVxufVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc2VsZWN0UGljdHVyZXMnLCAoJHJvb3RTY29wZSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0Y29udHJvbGxlcjogJ1Bob3RvQ3RybCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9waG90by9zZWxlY3QtcGhvdG8uaHRtbCcsXG5cdFx0bGluazogKHNjb3BlKSA9PiB7XG5cdH1cbn1cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ3NpbmdsZVBob3RvJywgKCRyb290U2NvcGUsICRzdGF0ZSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0c2NvcGU6IHtcblx0XHRcdHBob3RvOiAnPSdcblx0XHR9LFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcGhvdG8vc2luZ2xlLXBob3RvLmh0bWwnLFxuXHRcdGxpbms6IChzY29wZSkgPT4ge1xuXHRcdFx0c2NvcGUudmlld1Bob3RvID0gKCkgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhzY29wZS5waG90byk7XG5cdFx0XHRcdC8vICRzdGF0ZS5nbygnZWRpdHBob3RvJywge3Bob3RvSWQ6IHNjb3BlLnBob3RvLl9pZH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRcblx0fVxufVxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
