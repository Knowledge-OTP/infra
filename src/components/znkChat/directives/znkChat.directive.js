(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat',
        function ($translatePartialLoader, znkChatSrv, $q, UtilitySrv, ZNK_CHAT, $timeout, $window) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {
                    localUser: '='
                },
                link: function (scope, element) {
                    $translatePartialLoader.addPart('znkChat');
                    $timeout(function(){
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
                            destroyClosedChatWatcher = scope.$watch('d.chatData.chatParticipantsArr', function (chatParticipantsArr) {
                                if (angular.isArray(chatParticipantsArr)) {
                                    scope.d.numOfNotSeenMessages = 0;
                                    for (var i = 0; i < chatParticipantsArr.length; i++) {
                                        if (chatParticipantsArr[i].messagesNotSeen > 0) {
                                            scope.d.numOfNotSeenMessages += chatParticipantsArr[i].messagesNotSeen;
                                            scope.d.numOfNotSeenMessages = (scope.d.numOfNotSeenMessages < ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES) ? scope.d.numOfNotSeenMessages : 10;
                                        }
                                    }
                                }
                            }, true);
                        } else {
                            destroyClosedChatWatcher();
                        }
                    }

                    _closedChatHandler(WATCH_ON);         // indication to new messages when the chat is closed

                    scope.d.openChat = function () {
                        $timeout(function () {
                            $window.document.querySelector('.chat-textarea').focus();
                        });

                        scope.d.chatStateView = scope.statesView.CHAT_VIEW;
                        isChatClosed = false;
                        if(angular.isDefined(scope.d.selectedChatter.uid)) {
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

