(function (angular) {
    'use strict';

    angular.module('demo').config(function (InfraConfigSrvProvider, ENV) {
        var authDbPath = 'https://znk-dev.firebaseio.com/';
        var dataDbPath = 'https://sat-dev.firebaseio.com/';

        var authRef = new Firebase(authDbPath, ENV.firebaseAppScopeName);
        var authProm = authRef.authWithPassword({
            email: 'tester@zinkerz.com',
            password: '111111'
        }).then(function(res){
            console.log('success', res);
            return res;
        }).catch(function(err){
            console.error(err);
        });

        var dataRef = new Firebase(dataDbPath, ENV.firebaseAppScopeName);
        var dataAuthProm = dataRef.authWithCustomToken('TykqAPXV4zlTTG0v6UuOt4OF3HssDykhJd90dAIc', ENV.firebaseAppScopeName);

        function storageGetter(path) {
            return function(storageFirebaseAdapter, StorageSrv, $q) {
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

        InfraConfigSrvProvider.setStorages(storageGetter(dataDbPath), storageGetter(dataDbPath + '/sat_app'));
    });
})(angular);
