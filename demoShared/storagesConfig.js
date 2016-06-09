(function (angular) {
    'use strict';

    angular.module('demo').config(function (InfraConfigSrvProvider) {
        var authDbPath = 'https://znk-dev.firebaseio.com/';
        var dataDbPath = 'https://sat-dev.firebaseio.com/';

        var authRef,
            dataAuthProm,
            authProm,
            dataRef;

        function storageGetter(path) {
            return function(storageFirebaseAdapter, StorageSrv, $q, ENV) {
                var APP_NAME_KEY = 'znkFbData';  // local storage keys;
                var EMAIL_KEY = 'znkUser';
                var PASSWORD_KEY = 'znkPwd';

                var appName = _returnValOrDefault(localStorage.getItem(APP_NAME_KEY), ENV.firebaseAppScopeName);
                var email = _returnValOrDefault(localStorage.getItem(EMAIL_KEY),  'tester@zinkerz.com');
                var password = _returnValOrDefault(localStorage.getItem(PASSWORD_KEY), '111111');

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
        debugger;
        InfraConfigSrvProvider.setStorages(storageGetter(dataDbPath), storageGetter(dataDbPath + '/sat_app'));
    });
})(angular);

