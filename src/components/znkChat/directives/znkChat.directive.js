(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat',
        function ($translatePartialLoader, znkChatSrv, $q, UtilitySrv) {
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
                    scope.d.selectedChatter = {};

                    scope.d.chatStateView = statesView.CHAT_VIEW;
                    scope.d.openChat = function () {
                        scope.chatStateView = statesView.CHAT_VIEW;
                    };

                    $q.all([znkChatSrv.getChatParticipants(), znkChatSrv.getChatGuidsByUid(localUid)]).then(function (res) {
                        scope.d.chatData.chatParticipantsArr = UtilitySrv.object.convertToArray(res[0]);
                        scope.d.chatData.localUserChatGuidsArr = UtilitySrv.object.convertToArray(res[1]);
                        scope.d.chatData.localUserId = localUid;
                    });

                    scope.d.selectChatter = function (chatter) {
                        if (scope.d.selectedChatter.isActive) {
                            scope.d.selectedChatter.isActive = false;
                        }
                        scope.d.selectedChatter = chatter;
                        scope.d.selectedChatter.isActive = true;
                        scope.d.selectedChatter.messagesNotSeen = 0;
                        if (chatter.chatMessages.length > 0) {
                            var lastMessage = chatter.chatMessages[chatter.chatMessages.length - 1];
                            znkChatSrv.updateLasSeenMessage(chatter.chatGuid, localUid, lastMessage.time);
                        }
                    };
                }
            };
        }
    );
})(angular);

