(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat',
        function ($translatePartialLoader, znkChatSrv, $q, UtilitySrv, ZNK_CHAT, $timeout) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {
                    localUser: '='
                },
                link: function (scope, element) {
                    $translatePartialLoader.addPart('znkChat');
                    $timeout(function () {
                        element.addClass('animate-chat');
                    });

                    scope.statesView = {
                        CHAT_BUTTON_VIEW: 1,
                        CHAT_VIEW: 2
                    };
                    var destroyClosedChatWatcher = angular.noop;
                    var isChatClosed = true;
                    var WATCH_ON = true, WATCH_OFF = false;

                    scope.d = {};
                    scope.d.selectedChatter = {};
                    scope.d.chatData = {};
                    scope.d.chatData.localUser = scope.localUser;
                    scope.d.chatStateView = scope.statesView.CHAT_BUTTON_VIEW;
                    scope.d.maxNumUnseenMessages = ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES;

                    scope.d.actions = {};

                    znkChatSrv.getChatGuidsByUid(scope.localUser.uid, scope.localUser.isTeacher).then(function (chatGuidsObj) {
                        scope.d.chatData.localUserChatsGuidsArr = UtilitySrv.object.convertToArray(chatGuidsObj);
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
                        scope.d.selectedChatter.isActive = false;
                        scope.d.selectedChatter = chatter;
                        if (isChatClosed) {
                            return;
                        }

                        scope.d.selectedChatter.isActive = true;
                        scope.d.selectedChatter.messagesNotSeen = 0;
                        if (chatter.chatMessages.length > 0) {
                            var message = chatter.chatMessages[chatter.chatMessages.length - 1];
                            var lastSeenMessage = {};
                            lastSeenMessage.time = message.time;
                            lastSeenMessage.messageId = message.id;
                            scope.d.selectedChatter.lastSeenMessage = lastSeenMessage;
                            znkChatSrv.updateLasSeenMessage(chatter.chatGuid, scope.localUser.uid, lastSeenMessage);
                        }
                    }

                    function _closedChatHandler(watch) {
                        if (watch) {
                            destroyClosedChatWatcher.chatters = scope.$watch('d.chatData.chatParticipantsArr', function () {
                                _countUnseenMessages();
                            }, true);

                            destroyClosedChatWatcher.support = scope.$watch('d.chatData.support && d.chatData.support.messagesNotSeen', function () {
                                _countUnseenMessages();
                            });

                        } else {
                            destroyClosedChatWatcher.chatters();
                            destroyClosedChatWatcher.support();
                        }
                    }

                    function _countUnseenMessages() {
                        scope.d.numOfNotSeenMessages = 0;
                        var chatParticipantsArr = scope.d.chatData.chatParticipantsArr;
                        var supportObj = scope.d.chatData.support;

                        if (angular.isArray(chatParticipantsArr)) {
                            for (var i = 0; i < chatParticipantsArr.length; i++) {
                                if (chatParticipantsArr[i].messagesNotSeen > 0) {
                                    scope.d.numOfNotSeenMessages += chatParticipantsArr[i].messagesNotSeen;
                                }
                            }
                        }

                        if (angular.isDefined(supportObj)) {
                            if (supportObj.messagesNotSeen > 0) {
                                scope.d.numOfNotSeenMessages += supportObj.messagesNotSeen;
                            }
                        }
                        scope.d.numOfNotSeenMessages = (scope.d.numOfNotSeenMessages < ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES) ? scope.d.numOfNotSeenMessages : ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES;
                    }

                    _closedChatHandler(WATCH_ON);        // indication to new messages when the chat is closed


                    scope.d.openChat = function () {
                        if (scope.d.actions.scrollToLastMessage) {
                            scope.d.actions.scrollToLastMessage();
                        }

                        $timeout(function () {
                            element[0].querySelector('.chat-textarea').focus();
                        });
                        scope.d.chatStateView = scope.statesView.CHAT_VIEW;
                        isChatClosed = false;
                        if (angular.isDefined(scope.d.selectedChatter.uid)) {
                            scope.d.selectChatter(scope.d.selectedChatter);
                        }
                        _closedChatHandler(WATCH_OFF);
                    };

                    scope.d.closeChat = function () {
                        scope.d.chatStateView = scope.statesView.CHAT_BUTTON_VIEW;
                        isChatClosed = true;
                        scope.d.selectedChatter.isActive = false;
                        _closedChatHandler(WATCH_ON);
                    };
                }
            };
        }
    );
})(angular);

