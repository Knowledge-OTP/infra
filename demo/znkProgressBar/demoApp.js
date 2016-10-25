(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.znkProgressBar'])
        .config(function ($translateProvider) {
            'ngInject';
            $translateProvider.preferredLanguage('en');
            $translateProvider.useSanitizeValueStrategy(null);
        });
})(angular);
