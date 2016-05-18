(function (angular) {
    'use strict';

    angular.module('demo').config(function (InfraConfigSrvProvider) {
        var authDbPath = 'https://znk-dev.firebaseio.com/';
        var dataDbPath = 'https://sat-dev.firebaseio.com/';

        var authRef = new Firebase(authDbPath);
        var authProm = authRef.authWithPassword({
            email: 'tester@zinkerz.com',
            password: '111111'
        }).catch(function(err){
            console.error(err);
        });

        var dataRef = new Firebase(dataDbPath);
        var dataAuthProm = dataRef.authWithCustomToken('TykqAPXV4zlTTG0v6UuOt4OF3HssDykhJd90dAIc');

        function storageGetter(path) {
            return (storageFirebaseAdapter, StorageSrv, $q) => {
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
