(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(function (WebcallSrvProvider, ENV) {
            'ngInject';
            WebcallSrvProvider.setCallCred({
                username: ENV.plivoUsername,
                password: ENV.plivoPassword
            });
        });
})(angular);
