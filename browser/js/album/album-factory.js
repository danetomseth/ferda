app.factory('AlbumFactory', function($http) {
    return {
        createAlbum: (album) => {
            return $http.post('/api/albums/', album).then(res => {
                return res.data;
            })
        },
        fetchAll: () => {
            return $http.get('/api/albums/')
            .then(res => {
                return res.data;
            })
        },
        updateAlbum: (album) => {
            return $http.post('/api/albums/update', album)
            .then(res => {
                return res.data;
            })
        },
        fetchOne: (albumId) => {
            return $http.get('/api/albums/'+ albumId)
            .then(res => {
                return res.data
            });
        },
        findUserAlbums: (userId) => {
            return $http.get('/api/albums/user/' + userId).then(res => {
                return res.data;
            })
        },
        addPhoto: (photoId) => {
            return $http.post('/api/albums/photo/' + photoId)
            .then(res => {
                return res.data
            });
        },
        deleteAlbum: (albumId) => {
            return $http.delete('/api/albums/'+ albumId)
        }
    }

})