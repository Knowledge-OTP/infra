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

            var CHAT_PATH = "chats";
            var GET_PARTICIPANTS_PATH = "users/$$uid/invitations/approved";
            var PARTICIPANT_PATH = "users/sat_dashboard/users/$$uid/";
            znkChatDataSrvProvider.setChatPath(CHAT_PATH);
            znkChatDataSrvProvider.setParticipantsGetterPath(PARTICIPANTS_PATH);
            znkChatDataSrvProvider.setParticipantsPath(PARTICIPANTS_PATH);
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
