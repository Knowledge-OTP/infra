(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing')
        .config(
            function ($translateProvider) {
                'ngInject';
                $translateProvider.translations('en', {
                    "SCREEN_SHARING":{
                        "SHARE_SCREEN_REQUEST": "Share Screen Request",
                        "WANT_TO_SHARE": "{{name}} wants to share his screen with you.",
                        "REJECT": "REJECT",
                        "ACCEPT": "ACCEPT"
                    }
                });
            });
})(angular);
