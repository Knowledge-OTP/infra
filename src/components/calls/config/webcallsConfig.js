(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(function (WebcallSrvProvider) {
            'ngInject';
            WebcallSrvProvider.setCallCred({
                username:'ZinkerzDev160731091034',
                password:'zinkerz$9999'
            });
        });
})(angular);
