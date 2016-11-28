(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(function (WebcallSrvProvider) {
            'ngInject';
            WebcallSrvProvider.setCallCred({
            username: 'ZinkerzDev160731091034',     // ENV.plivoUsername,
            password: 'zinkerz$9999'     // ENV.plivoPassword
            });
        });
})(angular);
