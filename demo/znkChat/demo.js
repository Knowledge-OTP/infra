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
                chatsUsersGuids: 'users/$$uid/chats',
                studentAppName: 'sat_app',
                dashboardAppName: 'sat_dashboard',
                newChatParticipantsListener: 'users/$$uid/invitations/approved'
            };

            function buildChatter($q) {
                'ngInject';
                return function (teacher) {
                    var studentObj = {
                        name: teacher.senderName,
                        email: teacher.senderEmail,
                        uid: teacher.senderUid,
                        isTeacher: true
                    };
                    return $q.when(studentObj);
                }

            }

            znkChatDataSrvProvider.setChatPaths(chatPaths);
            znkChatDataSrvProvider.setBuildChatterFnGetter(buildChatter);
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

    angular.module('znk.infra.presence').constant('ENV', {
        firebaseAppScopeName: "sat_app",
        fbDataEndPoint: "https://sat-dev.firebaseio.com/",
        appContext: 'student',
        studentAppName: 'sat_app',
        firebaseDashboardAppScopeName: 'sat_dashboard',
        videosEndPoint: "//dfz02hjbsqn5e.cloudfront.net/sat_app/",
        mediaEndPoint: "//dfz02hjbsqn5e.cloudfront.net/",
        fbGlobalEndPoint: 'https://znk-dev.firebaseio.com/'
    })
})(angular);
