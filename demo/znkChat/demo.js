(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.znkChat',
        'znk.infra.config',
        'znk.infra.storage',
        'pascalprecht.translate',
        'znk.infra.user',
        'znk.infra.utility'
    ])
        .config(function ($translateProvider, znkChatDataSrvProvider) {
            $translateProvider.useLoader('$translatePartialLoader', {
                urlTemplate: '/znkChat/locale/{lang}.json'
            })
                .preferredLanguage('en');

            var CHATS_PATH = "chats";
            var CHATTER_PATH = "sat_dashboard/users/$$uid";
            var LOCAL_USER_PATH = "sat_app/users/$$uid";
            znkChatDataSrvProvider.setChatPath(CHATS_PATH);
            znkChatDataSrvProvider.setParticipantsPath(PARTICIPANTS_PATH);
            znkChatDataSrvProvider.setChatterPath(CHATTER_PATH);
            znkChatDataSrvProvider.setLocalUserPath(LOCAL_USER_PATH);
        })
        .controller('ctrl', function ($scope, InfraConfigSrv) {
            $scope.userChatObj = {
                chatGuids: ['guid1','guid2','guid3', 'guid4'],
                name: 'Abra Kadabra',
                uid: 'simplelogin:12333'
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
