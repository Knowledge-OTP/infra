(function (angular) {
    'use strict';

    angular.module('demo')
        .config(function (InfraConfigSrvProvider) {
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

            angular.forEach(keysObj, function (keyValue, keyName) {
                var localData = localStorage.getItem(keyValue);
                if (localData) {
                    options[keyName] = localData;
                }
            });

            InfraConfigSrvProvider.setStorageServiceName('DemoStorageSrv');
        })
        .service('DemoStorageSrv', function (ENV) {
            var authRef = new Firebase(options.authDbPath, ENV.firebaseAppScopeName);
            var fbAdapter = storageFirebaseAdapter(path);
            var config = {
                variables: {
                    uid: function () {
                        return authRef.uid;
                    }
                },
                cache: /.*/
            };
            return new StorageSrv(fbAdapter.get, fbAdapter.set, config);
        });
})(angular);
