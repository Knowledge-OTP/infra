(function (angular) {
    'use strict';

    angular.module('demo').config(function (InfraConfigSrvProvider) {
        var authDbPath = 'https://znk-dev.firebaseio.com/';
        var dataDbPath = 'https://sat-dev.firebaseio.com/';

        var APP_NAME_KEY = 'znkFbData';  // local storage key;
        var appName = localStorage.getItem(APP_NAME_KEY);

        var authRef,
            dataAuthProm,
            authProm,
            dataRef;

        function storageGetter(path) {
            return function(storageFirebaseAdapter, StorageSrv, $q, ENV) {
                var EMAIL_KEY = 'znkUser';   // local storage keys.
                var PASSWORD_KEY = 'znkPwd';

                var email = _returnValOrDefault(localStorage.getItem(EMAIL_KEY),  'tester@zinkerz.com');
                var password = _returnValOrDefault(localStorage.getItem(PASSWORD_KEY), '111111');
                appName = _returnValOrDefault(appName, ENV.firebaseAppScopeName);

                function _returnValOrDefault(val, defaultVal){
                    return angular.isDefined(val) ? val : defaultVal;
                }

                if(!authRef){
                    authRef = new Firebase(authDbPath, appName);
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
                    dataAuthProm = dataRef.authWithCustomToken('TykqAPXV4zlTTG0v6UuOt4OF3HssDykhJd90dAIc'); // get the token from local storage also?
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

        InfraConfigSrvProvider.setStorages(storageGetter(dataDbPath), storageGetter(dataDbPath + appName));
    });
})(angular);

