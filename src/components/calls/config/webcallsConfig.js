(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(function (WebcallSrvProvider) {
            'ngInject';
            WebcallSrvProvider.setCallCred({
                username:'devUsrZinkerz160726161534',
                password:'zinkerz$9999'
            });
        });
})(angular);
