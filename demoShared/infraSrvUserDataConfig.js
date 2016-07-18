(function (angular) {
    'use strict';

    angular.module('demo').config(function (InfraConfigSrvProvider) {
        InfraConfigSrvProvider.setUserDataFn(function (ENV) {
            var authDbPath = 'https://znk-dev.firebaseio.com/';
            var ref = new Firebase(authDbPath, ENV.firebaseAppScopeName);
            var userAuth = ref.getAuth();
            return {
                uid: userAuth.uid
            };
        });
    });
})(angular);
