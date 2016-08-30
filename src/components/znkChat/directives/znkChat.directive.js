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

                    var listenerActive = false;
                    var callbacksToRemove = {};
                    var localUid = scope.userChatObj.uid;
                    var localUserChatGuidsArr;

                    var statesView = {
                        CHAT_BUTTON_VIEW: 1,
                        CHAT_VIEW: 2

                    };

                    scope.d = {};
                    scope.d.chatStateView = statesView.CHAT_VIEW;
                    scope.d.openChat = function () {
                        scope.chatStateView = statesView.CHAT_VIEW;
                    };

                    $q.all([znkChatSrv.getChatGuidsByUid(localUid), znkChatSrv.getChatParticipants()]).then(function (res) {
                        localUserChatGuidsArr = res[0];
                        var chatParticipantsArr = UtilitySrv.object.convertToArray(res[1]);
                        znkChatSrv.setToParticipantsChatData(localUserChatGuidsArr, chatParticipantsArr, localUid).then(function (result) {
                            scope.d.chatParticipantsArr = result;
                            scope.d.selectChatter(scope.d.chatParticipantsArr[0]);
                        });
                    });


                    scope.d.selectChatter = function (chatter) {
                        var chatterUid = chatter.uid;
                        var chatGuidProm;

                        znkChatSrv.getChatGuidsByUid(chatterUid).then(function (chatterChatGuidsArr) {
                            if (angular.isArray(localUserChatGuidsArr) && angular.isArray(chatterChatGuidsArr) && localUserChatGuidsArr.length > 0 && chatterChatGuidsArr.length > 0) {
                                chatGuidProm = znkChatSrv.getChatGuidByTwoGuidsArray(localUserChatGuidsArr, chatterChatGuidsArr);
                            } else {
                                chatGuidProm = znkChatSrv.createNewChat(localUid, chatterUid);
                            }
                            $q.when(chatGuidProm).then(function (chatGuid) {
                                znkChatSrv.getChatMessages(chatGuid).then(function (chatMessages) {
                                    scope.d.chatGuid = chatGuid;
                                    scope.d.selectedChatter = chatter;
                                    scope.d.chatMessages = chatMessages;
                                    _resetNotSeenMessages(chatGuid);
                                    if (!listenerActive) {
                                        _startListen(localUserChatGuidsArr, chatGuid);
                                        listenerActive = true;
                                        scope.d.chatMessages = [];
                                    }
                                });
                            })
                        })
                    };

                    function _startListen(localUserChatGuidsArr) {
                        for (var i = 0; i < localUserChatGuidsArr.length; i++) {
                            var path = 'users/simplelogin:12333/chats/' + localUserChatGuidsArr[i] + '/messages'; // todo - make function that return this path
                            znkChatEventSrv.registerEvent('child_added', path, callbackWrapper(localUserChatGuidsArr[i]));
                        }

                        function callbackWrapper(chatGuid) {
                            function callback(snapShot) {
                                var newData = snapShot.val();
                                var currentChatGuid = scope.d.chatGuid; // todo - check if it's correct guid
                                if (newData && chatGuid === currentChatGuid) {
                                    var lastSeenMessage = newData.time; // todo - get last seen message
                                    scope.d.chatMessages.push(newData);
                                    znkChatSrv.updateLasSeenMessage(currentChatGuid, localUid, lastSeenMessage);
                                    _updateChatsParticipants(lastSeenMessage, chatGuid);
                                } else {
                                    debugger;
                                    _handleNotActiveChat(newData, chatGuid);
                                }
                            }
                            callbacksToRemove[chatGuid] = callback;
                            return callback;
                        }
                    }

                    function _handleNotActiveChat(newData, chatGuid) {
                        if (!newData) {
                            return;
                        }
                        for (var i = 0; i < scope.d.chatParticipantsArr.length; i++) {
                            if (scope.d.chatParticipantsArr[i].chatGuid === chatGuid) {
                                if (scope.d.chatParticipantsArr[i].lastSawMessage < newData.time) {
                                    scope.d.chatParticipantsArr[i].numOfNotSeenMessages++;
                                }
                            }
                        }
                    }

                    function _updateChatsParticipants(lastSeenMessage, chatGuid) {
                        var index = _getSpecificChatIndexByChatGuid(chatGuid);
                        scope.d.chatParticipantsArr[index].lastSawMessage = lastSeenMessage;
                        scope.d.chatParticipantsArr[index].numOfNotSeenMessages = 0;
                    }

                    function _resetNotSeenMessages(chatGuid) {
                        var index = _getSpecificChatIndexByChatGuid(chatGuid);
                        scope.d.chatParticipantsArr[index].numOfNotSeenMessages = 0;
                    }

                    function _getSpecificChatIndexByChatGuid(chatGuid) {
                        for (var i = 0; i < scope.d.chatParticipantsArr.length; i++) {
                            if (scope.d.chatParticipantsArr[i].chatGuid === chatGuid) {
                                return i;
                            }
                        }
                    }
                }
            };
        }
    );
})(angular);

