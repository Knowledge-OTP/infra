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
                    var destroyClosedChatWatcher = angular.noop;
                    var isChatClosed = true;
                    var WATCH_ON = true, WATCH_OFF = false;

                    scope.d = {};
                    scope.d.selectedChatter = {};
                    scope.d.chatData = {};
                    scope.d.chatData.localUser = scope.localUser;

                    scope.d.chatStateView = scope.statesView.CHAT_BUTTON_VIEW;
                    _closedChatHandler(WATCH_ON); // indication to new messages when the chat is closed

                    scope.d.openChat = function () {
                        scope.d.chatStateView = scope.statesView.CHAT_VIEW;
                        isChatClosed = false;
                        _chatterSelected(scope.d.selectedChatter);
                        _closedChatHandler(WATCH_OFF);
                    };

                    scope.d.closeChat = function () {
                        scope.d.chatStateView = scope.statesView.CHAT_BUTTON_VIEW;
                        isChatClosed = true;
                        _closedChatHandler(WATCH_ON);
                    };


                    $q.all([znkChatSrv.getChatParticipants(), znkChatSrv.getChatGuidsByUid(localUid)]).then(function (res) {
                        scope.d.chatData.chatParticipantsArr = UtilitySrv.object.convertToArray(res[0]);
                        scope.d.chatData.localUserChatsGuidsArr = UtilitySrv.object.convertToArray(res[1]);
                    });

                    scope.d.selectChatter = function (chatter) {
                        if (angular.isUndefined(chatter.chatGuid)) {
                            znkChatSrv.createNewChat(scope.localUser, chatter).then(function (chatGuid) {
                                chatter.chatGuid = chatGuid;
                                _chatterSelected(chatter);
                            });
                        } else {
                            _chatterSelected(chatter);
                        }
                    };

                    function _chatterSelected(chatter) {
                        if (scope.d.selectedChatter.isActive) {
                            scope.d.selectedChatter.isActive = false;
                        }
                        scope.d.selectedChatter = chatter;

                        if (isChatClosed) {
                            return;
                        }

                        scope.d.selectedChatter.isActive = true;
                        scope.d.selectedChatter.messagesNotSeen = 0;
                        if (chatter.chatMessages.length > 0) {
                            var message = chatter.chatMessages[chatter.chatMessages.length - 1];
                            var lastMessageTime = {};
                            lastMessageTime.time = message.time;
                            lastMessageTime.id = message.id;
                            scope.d.selectedChatter.lastMessageTime = lastMessageTime;
                            znkChatSrv.updateLasSeenMessage(chatter.chatGuid, localUid, lastMessageTime);
                        }
                    }

                    function _closedChatHandler(watch) {
                        if (watch) {
                            destroyClosedChatWatcher = scope.$watch('d.chatData.chatParticipantsArr', function (chatParticipantsArr) {
                                if (angular.isArray(chatParticipantsArr)) {
                                    scope.d.numOfNotSeenMessages = 0;
                                    for (var i = 0; i < chatParticipantsArr.length; i++) {
                                        chatParticipantsArr[i].isActive = false;
                                        if (chatParticipantsArr[i].messagesNotSeen > 0) {
                                            scope.d.numOfNotSeenMessages += chatParticipantsArr[i].messagesNotSeen;
                                        }
                                    }
                                }
                            }, true)
                        } else {
                            destroyClosedChatWatcher();
                        }
                    }
                }
            };
        }
    );
})(angular);

