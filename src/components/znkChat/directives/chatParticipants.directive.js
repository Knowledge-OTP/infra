(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants', ['znkChatSrv',
        function (znkChatSrv) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatParticipants.template.html',
                scope: {
                    selectChatter: '&'
                },
                link: function (scope) {
                    scope.d = {};
                    znkChatSrv.getChatParticipants().then(function (chatParticipantsArr) {
                        scope.d.chatParticipantsArr = chatParticipantsArr;
                        scope.selectChatter()(scope.d.chatParticipantsArr[0]);
                    });
                }
            };
        }
    ]);
})(angular);

