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

                    var statesView = {
                        CHAT_BUTTON_VIEW: 1,
                        CHAT_VIEW: 2

                    };

                    scope.d = {};
                    scope.d.chatStateView = statesView.CHAT_VIEW;
                    scope.d.openChat = function () {
                        scope.chatStateView = statesView.CHAT_VIEW;
                    };

                    scope.d.selectChatter = function (chatter) {
                        var chatterUid = chatter.uid;

                        var localUserChatsGuidsProm = znkChatSrv.getChatGuidsByUid(localUid);
                        var chatterChatsGuidProm = znkChatSrv.getChatGuidsByUid(chatterUid);
                        var chatGuidProm;

                        $q.all([localUserChatsGuidsProm, chatterChatsGuidProm]).then(function (results) {
                            var localUserChatGuidsArr = results[0];
                            var chatterChatGuidsArr = results[1];
                            if (angular.isArray(localUserChatGuidsArr) && angular.isArray(chatterChatGuidsArr) && localUserChatGuidsArr.length > 0 && chatterChatGuidsArr.length > 0) {
                                chatGuidProm = znkChatSrv.getChatGuidByTwoGuidsArray(localUserChatGuidsArr, chatterChatGuidsArr);
                            } else {
                                chatGuidProm = znkChatSrv.createNewChat(localUid, chatterUid);
                            }
                            $q.when(chatGuidProm).then(function (chatGuid) {
                                znkChatSrv.getChatMessages(chatGuid).then(function (chatMessages) {
                                    scope.d.chatGuid = chatGuid;
                                    scope.d.selectedChatter = chatter;

                                    if (!listenerActive) {
                                        _startListen(localUserChatGuidsArr, chatGuid);
                                    }
                                });
                            })
                        })
                    };

                    znkChatSrv.getChatParticipants().then(function (chatParticipantsArr) {
                        scope.d.chatParticipantsArr = UtilitySrv.object.convertToArray(chatParticipantsArr);
                        scope.d.selectChatter(scope.d.chatParticipantsArr[0]);
                    });

                    function _startListen(localUserChatGuidsArr) {
                        for (var i = 0; i < localUserChatGuidsArr.length; i++) {
                            var path = 'users/simplelogin:12333/chats/' + localUserChatGuidsArr[i]; // todo - make function that return this path
                            znkChatEventSrv.registerEvent('value', path, callbackWrapper(localUserChatGuidsArr[i]));
                        }

                        function callbackWrapper(key) {
                            function callback(newData) {
                                var currentChatGuid = scope.d.chatGuid; // todo - check if it's correct guid
                                if (newData && key === currentChatGuid) {
                                    scope.d.chatMessages = newData.messages;
                                    var lastSeenMessage = 0; // todo - get last seen message
                                    znkChatSrv.updateLasSeenMessage(currentChatGuid, localUid,lastSeenMessage )
                                } else {
                                    if(newData.messages) {
                                        var numOfUnseenMessages = znkChatEventSrv.handleNotActiveChat(newData, localUid);
                                    }
                                }
                            }

                            callbacksToRemove[key] = callback;
                            return callback;
                        }
                    }
                }
            };
        }
    );
})(angular);

