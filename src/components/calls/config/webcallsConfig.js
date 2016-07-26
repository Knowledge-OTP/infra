(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(function (WebcallSrvProvider) {
            'ngInject';
            WebcallSrvProvider.setCallCred({
                username:'assafshp160721153735',
                password:'khjihghs'
            });
        });
})(angular);
