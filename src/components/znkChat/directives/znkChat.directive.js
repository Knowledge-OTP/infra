(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat',
        function ($translatePartialLoader, znkChatSrv, $q, UtilitySrv, znkChatEventSrv) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {
                    userChatObj: '='
                },
                link: function (scope) {
                    $translatePartialLoader.addPart('znkChat');

                    var localUid = scope.userChatObj.uid;

                    var statesView = {
                        CHAT_BUTTON_VIEW: 1,
                        CHAT_VIEW: 2
                    };

                    scope.d = {};
                    scope.d.chatData = {};

                    scope.d.chatStateView = statesView.CHAT_VIEW;
                    scope.d.openChat = function () {
                        scope.chatStateView = statesView.CHAT_VIEW;
                    };
                    
                    $q.all([znkChatSrv.getChatParticipants(),znkChatSrv.getChatGuidsByUid(localUid)]).then(function (res) {
                        scope.d.chatData.chatParticipantsArr = UtilitySrv.object.convertToArray(res[0]);
                        scope.d.chatData.localUserChatGuidsArr = UtilitySrv.object.convertToArray(res[1]);
                        scope.d.chatData.localUserId = localUid;
                    });

                    scope.d.selectChatter = function (chatter) {
                        scope.d.selectedChatter = chatter;
                    };
                }
            };
        }
    );
})(angular);

