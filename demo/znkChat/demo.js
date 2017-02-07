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
        .config(function (znkChatDataSrvProvider, PresenceServiceProvider) {
            'ngInject';

            localStorage.setItem('email','van_damme@zinkerz.com');
            localStorage.setItem('password','123123');
            localStorage.setItem('dataDbPath','https://sat-dev.firebaseio.com/');
            localStorage.setItem('studentPath','/sat_app');
            localStorage.setItem('teacherPath','/sat_dashboard');


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
        .run(function ($rootScope, AuthService) {
            'ngInject';
            var authData = AuthService.getAuth();

            $rootScope.localUser = {
                uid: authData.uid,
                isTeacher: false
            };
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
