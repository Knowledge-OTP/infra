(function (angular) {
    'use strict';

    angular.module('demo').config(function (InfraConfigSrvProvider) {
        InfraConfigSrvProvider.setUserDataFn(function () {
            return {
                uid: '21794e2b-3051-4016-8491-b3fe70e8212d'
            };
        });
    });
})(angular);
