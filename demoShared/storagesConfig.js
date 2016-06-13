(function (angular) {
    'use strict';

    angular.module('demo').config(function (InfraConfigSrvProvider) {
        var authDbPath = 'https://znk-dev.firebaseio.com/';
        var dataDbPath = 'https://sat-dev.firebaseio.com/';

        var authRef,
            dataAuthProm,
            authProm,
            dataRef;

        // local storage keys
        var EMAIL_KEY = 'znkUser',
            PASSWORD_KEY = 'znkPwd';

        var DEFAULT_EMAIL = 'tester@zinkerz.com',
            DEFAULT_PASSWORD = 111111;

        var email = angular.isDefined(localStorage.getItem(EMAIL_KEY)) ? localStorage.getItem(EMAIL_KEY) : DEFAULT_EMAIL;
        var password = angular.isDefined(localStorage.getItem(PASSWORD_KEY)) ? localStorage.getItem(PASSWORD_KEY) : DEFAULT_PASSWORD;

        function storageGetter(path) {
            return function(storageFirebaseAdapter, StorageSrv, $q, ENV) {
                if(!authRef){
                    authRef = new Firebase(authDbPath, ENV.firebaseAppScopeName);
                    authProm = authRef.authWithPassword({
                        email: email,
                        password: password
                    }).then(function(res){
                        console.log('success', res);
                        return res;
                    }).catch(function(err){
                        console.error(err);
                    });
                    dataRef = new Firebase(dataDbPath, ENV.firebaseAppScopeName);
                    dataAuthProm = dataRef.authWithCustomToken('TykqAPXV4zlTTG0v6UuOt4OF3HssDykhJd90dAIc');
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

        InfraConfigSrvProvider.setStorages(storageGetter(dataDbPath), storageGetter(dataDbPath + '/sat_app'));
    });
})(angular);
