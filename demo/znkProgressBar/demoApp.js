(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.znkProgressBar'])
        .config(function ($translateProvider) {
            $translateProvider.useLoader('$translatePartialLoader', {
                urlTemplate: '/{part}/locale/{lang}.json'
            })
                .preferredLanguage('en');
        })

        .run(function ($rootScope, $translate) {
            $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
                $translate.refresh();
            })
        });
})(angular);
