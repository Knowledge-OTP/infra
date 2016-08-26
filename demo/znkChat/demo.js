(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.znkChat',
        'znk.infra.config',
        'znk.infra.storage',
        'pascalprecht.translate'
    ])
        .config(function ($translateProvider) {
            $translateProvider.useLoader('$translatePartialLoader', {
                urlTemplate: '/znkChat/locale/{lang}.json'
            })
                .preferredLanguage('en');
        })
        .controller('ctrl', function ($scope, InfraConfigSrv) {
            $scope.userChatObj = {
                chatGuids: ['guid1','guid2','guid3', 'guid4'],
                name: 'Abra Kadabra'
            };
            InfraConfigSrv.getGlobalStorage().then(function (x) {
            })
        })
        .run(function ($rootScope, $translate) {
            $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
                $translate.refresh();
            })
        });

})(angular);
