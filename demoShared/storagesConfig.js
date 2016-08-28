(function (angular) {
    'use strict';

    angular.module('demo').config(function (InfraConfigSrvProvider) {
        var authRef,
            dataAuthProm,
            authProm,
            dataRef;

        // default options
        var options = {
            email: 'tester@zinkerz.com',
            password: 111111,
            authDbPath: 'https://znk-dev.firebaseio.com/',
            dataDbPath: 'https://sat-dev.firebaseio.com/',
            dataAuthToken: 'TykqAPXV4zlTTG0v6UuOt4OF3HssDykhJd90dAIc',
            studentPath: '/sat_app',
            teacherPath: '/sat_dashboard',
            dataAuthSecret: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoicmFjY29vbnMifQ.mqdcwRt0W5v5QqfzVUBfUcQarD0IojEFNisP-SNIFLM",
            backendEndpoint: 'https://znk-web-backend-dev.azurewebsites.net/'
        };

        var keysObj = {
            email: 'znkUser',
            password: 'znkPwd',
            authDbPath: 'znkAuth',
            dataDbPath: 'znkData',
            dataAuthToken: 'znkAuthToken',
            studentPath: 'znkStudentPath'
        };

        angular.forEach(keysObj, function(keyValue, keyName) {
            var localData = localStorage.getItem(keyName);
            if (localData) {
                options[keyName] = localData;
            }
        });

        function storageGetter(path) {
            return function(StorageFirebaseAdapter, StorageSrv, $q, ENV, $http) {
                if(!authRef){
                    authRef = new Firebase(options.authDbPath, ENV.firebaseAppScopeName);
                    authProm = authRef.authWithPassword({
                        email: options.email,
                        password: '' + options.password
                    }).then(function(res){
                        console.log('success', res);

                        var postUrl = options.backendEndpoint + 'firebase/token';
                        var authData = authRef.getAuth();
                        var postData = {
                            email: authData.password ? authData.password.email : '',
                            uid: authData.uid,
                            fbDataEndPoint: options.dataDbPath,
                            fbEndpoint: options.authDbPath,
                            auth: options.dataAuthSecret,
                            token: authData.token
                        };

                        return $http.post(postUrl, postData).then(function (token) {
                            dataRef = new Firebase(options.dataDbPath, ENV.firebaseAppScopeName);
                            return dataRef.authWithCustomToken(token.data, function (error, userAuthData) {
                                console.log('authSrv::login(): uid=' + userAuthData.uid);
                            });
                        });
                    }).catch(function(err){
                        console.error(err);
                    });
                    // dataRef = new Firebase(options.dataDbPath, ENV.firebaseAppScopeName);
                    // dataAuthProm = dataRef.authWithCustomToken(options.dataAuthToken);
                }

                return $q.all([authProm, dataAuthProm]).then(function(res){
                    var auth = res[0];
                    var fbAdapter = new StorageFirebaseAdapter(path);
                    var config = {
                        variables: {
                            uid: function () {
                                return auth.uid;
                            }
                        },
                        cache: /.*/
                    };
                    return new StorageSrv(fbAdapter, config);
                });
            };
        }

        // todo - added teacher storage
        InfraConfigSrvProvider.setStorages(storageGetter(options.dataDbPath), storageGetter(options.dataDbPath + options.studentPath), storageGetter(options.dataDbPath + options.teacherPath));
    });
})(angular);
