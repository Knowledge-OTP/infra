(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.znkChat',
        'znk.infra.config',
        'znk.infra.storage',
        'pascalprecht.translate',
        'znk.infra.user',
        'znk.infra.utility',
        'ngAnimate'
    ])
        .config(function ($translateProvider, znkChatDataSrvProvider) {
            $translateProvider.useLoader('$translatePartialLoader', {
                urlTemplate: '/znkChat/locale/{lang}.json'
            })
                .preferredLanguage('en');
            var chatPaths = {
                chatPath: 'chats',
                chatsUsersGuids: 'users/$$uid/chats'
            };

            function participantsGetterFn(teachersSrv) {
                return teachersSrv.getAllTeachers();
            }

            znkChatDataSrvProvider.setChatPaths(chatPaths);
            znkChatDataSrvProvider.setParticipantsGetterFn(participantsGetterFn);

        })
        .controller('ctrl', function ($scope, InfraConfigSrv) {
            $scope.userChatObj = {
                chatGuids: ['guid1', 'guid2', 'guid3', 'guid4'],
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
