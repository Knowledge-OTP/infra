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
                 return teachersSrv.getAllTeachers().then(function(teachers){
                     var teachersKeys = Object.keys(teachers);
                     angular.forEach(teachersKeys, function (key) {
                         teachers[key].isTeacher = true;
                     });
                     return teachers;
                })
            }

            znkChatDataSrvProvider.setChatPaths(chatPaths);
            znkChatDataSrvProvider.setParticipantsGetterFn(participantsGetterFn);

        })
        .controller('ctrl', function ($scope) {
            $scope.localUser = {
                uid: 'simplelogin:12333',
                isTeacher: false
            };
        })
        .run(function ($rootScope, $translate) {
            $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
                $translate.refresh();
            })
        });

})(angular);
