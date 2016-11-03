(function (angular) {
    'use strict';

    angular.module('demo')
        .config(function ($translateProvider) {
            $translateProvider.useStaticFilesLoader({
                prefix: 'locale-',
                suffix: '.json'
            });
            $translateProvider.preferredLanguage('en');
            $translateProvider.forceAsyncReload(true);
            $translateProvider.useSanitizeValueStrategy(null);
        });
})(angular);
