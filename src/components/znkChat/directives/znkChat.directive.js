(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat',
        function ($translatePartialLoader, znkChatSrv, $q, UtilitySrv) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {
                    localUser: '='
                },
                link: function (scope) {
                    $translatePartialLoader.addPart('znkChat');

                    scope.statesView = {
                        CHAT_BUTTON_VIEW: 1,
                        CHAT_VIEW: 2
                    };
                    var localUid = scope.localUser.uid;


                    scope.d = {};
                    scope.d.selectedChatter = {};
                    scope.d.chatData = {};
                    scope.d.chatData.localUser = scope.localUser;

                    scope.d.chatStateView = scope.statesView.CHAT_BUTTON_VIEW;
                    scope.d.openChat = function () {
                        scope.d.chatStateView = scope.statesView.CHAT_VIEW;
                    };
                    scope.d.closeChat = function () {
                        scope.d.chatStateView = scope.statesView.CHAT_BUTTON_VIEW;
                    };

                    $q.all([znkChatSrv.getChatParticipants(), znkChatSrv.getChatGuidsByUid(localUid)]).then(function (res) {
                        scope.d.chatData.chatParticipantsArr = UtilitySrv.object.convertToArray(res[0]);
                        scope.d.chatData.localUserChatsGuidsArr = UtilitySrv.object.convertToArray(res[1]);
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

