(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .run(function (ENV, WebcallSrv) {
            'ngInject';
            WebcallSrv.setCallCredRunTime({
                username: ENV.plivoUsername,
                password: ENV.plivoPassword
            });
            WebcallSrv.activate();
        });
})(angular);
