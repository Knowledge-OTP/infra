(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(function (ENV, WebcallSrvProvider) {
            'ngInject';
            WebcallSrvProvider.setCallCred({
            username: ENV.plivoUsername,
            password: ENV.plivoPassword
            });
        });
})(angular);
