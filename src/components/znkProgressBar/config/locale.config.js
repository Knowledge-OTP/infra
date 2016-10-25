(function (angular) {
    'use strict';

    angular.module('znk.infra.znkProgressBar')
        .config(
            function ($translateProvider) {
                'ngInject';
                $translateProvider.translations('en', {
                    "ZNK_PROGRESS_BAR": {
                        "MASTERY": "Mastery"
                    }
                });
            });
})(angular);
