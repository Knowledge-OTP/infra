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
            studentPath: '/sat_app'
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
            var localData = localStorage.getItem(keyValue);
            if (localData) {
                options[keyName] = localData;
            }
        });

        function storageGetter(path) {
            return function(storageFirebaseAdapter, StorageSrv, $q, ENV) {
                if(!authRef){
                    authRef = new Firebase(options.authDbPath, ENV.firebaseAppScopeName);
                    authProm = authRef.authWithPassword({
                        email: options.email,
                        password: '' + options.password
                    }).then(function(res){
                        console.log('success', res);
                        return res;
                    }).catch(function(err){
                        console.error(err);
                    });
                    dataRef = new Firebase(options.dataDbPath, ENV.firebaseAppScopeName);
                    dataAuthProm = dataRef.authWithCustomToken(options.dataAuthToken);
                }

                return $q.all([authProm, dataAuthProm]).then(function(res){
                    var auth = res[0];
                    var fbAdapter = storageFirebaseAdapter(path);
                    var config = {
                        variables: {
                            uid: function () {
                                return auth.uid;
                            }
                        },
                        cache: /.*/
                    };
                    return new StorageSrv(fbAdapter.get, fbAdapter.set, config);
                });
            };
        }

        InfraConfigSrvProvider.setStorages(storageGetter(options.dataDbPath), storageGetter(options.dataDbPath + options.studentPath));
    });
})(angular);
