(function (angular) {
    'use strict';

    var deviceNotSupportedModule = angular.module('znk.infra.deviceNotSupported', []);
    deviceNotSupportedModule.factory('ENV', function() {
        var ENV = {
            debug: true
        };
        return ENV;
    });

})(angular);
