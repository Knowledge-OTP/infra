(function (angular) {
    'use strict';

    angular.module('znk.infra.general')
        .config(
            function ($translateProvider) {
                'ngInject';
                $translateProvider.translations('en', {
                    "TIMER": {
                        "SECONDS": "seconds",
                        "SEC":"sec"
                    }
                });
            });
})(angular);
