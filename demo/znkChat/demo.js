(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.znkChat',
        'znk.infra.config',
        'znk.infra.storage',
        'znk.infra.presence',
        'znk.infra.auth',
        'pascalprecht.translate',
        'znk.infra.user',
        'znk.infra.utility',
        'ngAnimate'
    ])
        .config(function ($translateProvider, znkChatDataSrvProvider, PresenceServiceProvider) {
            $translateProvider.useLoader('$translatePartialLoader', {
                urlTemplate: '/znkChat/locale/{lang}.json'
            })
                .preferredLanguage('en');
            var chatPaths = {
                chatPath: 'chats',
                chatsUsersGuids: 'users/$$uid/chats'
            };

            function participantsGetterFn(teachersSrv) {
                return teachersSrv.getAllTeachers().then(function (teachers) {
                    var teachersKeys = Object.keys(teachers);
                    angular.forEach(teachersKeys, function (key) {
                        teachers[key].isTeacher = true;
                    });
                    return teachers;
                })
            }

            znkChatDataSrvProvider.setChatPaths(chatPaths);
            znkChatDataSrvProvider.setParticipantsGetterFn(participantsGetterFn);
            PresenceServiceProvider.setAuthServiceName('AuthService');

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

    angular.module('znk.infra.presence')
        .provider('ENV', function () {
            this.$get = function () {
                return {
                    fbDataEndPoint: "https://sat-dev.firebaseio.com/",
                    firebaseAppScopeName: "sat_app",
                    appContext: 'student',
                    studentAppName: 'sat_app',
                    dashboardAppName: 'sat_dashboard',
                    videosEndPoint: "//dfz02hjbsqn5e.cloudfront.net/sat_app/",
                    mediaEndPoint: "//dfz02hjbsqn5e.cloudfront.net/",
                    fbGlobalEndPoint: "https://znk-dev.firebaseio.com/"

                }
            }
        })

})(angular);