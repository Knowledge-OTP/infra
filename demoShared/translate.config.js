(function (angular) {
    'use strict';

    angular.module('demo')
        .config(function ($translateProvider) {
            $translateProvider.useLoader('$translatePartialLoader', {
                urlTemplate: '/{part}/locale/{lang}.json'
            }).preferredLanguage('en');
        })
        .run(function ($rootScope, $translate) {
            $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
                $translate.refresh();
            });
        })
        .run(function ($translatePartialLoader, $timeout) {
            $timeout(function () {
                $translatePartialLoader.addPart('demoLocale');
            });
        });
})(angular);
