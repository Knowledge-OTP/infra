(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants',
        function (znkChatSrv, UtilitySrv) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatParticipants.template.html',
                scope: {
                    selectChatter: '&'
                },
                link: function (scope) {
                    scope.d = {};
                    znkChatSrv.getChatParticipants().then(function (chatParticipantsArr) {
                        scope.d.chatParticipantsArr = UtilitySrv.object.convertToArray(chatParticipantsArr);
                        scope.selectChatter()(scope.d.chatParticipantsArr[0]);

                    });
                }
            };
        }
    );
})(angular);

