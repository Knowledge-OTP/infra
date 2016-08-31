(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatter',
        function (znkChatSrv, $q, znkChatEventSrv, $timeout) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatter.template.html',
                scope: {
                    chatterObj: '=',
                    localUserChatsGuidsArr: '=',
                    localUserId: '&',
                    chatData:"=",
                    setFirstChatter: '&?'
                },
                link: function (scope) {
                    scope.d = {};
                    var chatGuidProm;
                    // var callbacksToRemove;

                    if (scope.chatData) {
                        var localUseId = scope.chatData.localUserId;
                        var localUserChatsGuidsArr = scope.chatData.localUserChatsGuidsArr;
                        znkChatSrv.getChatGuidsByUid(scope.chatterObj.uid).then(function (chatterChatGuidsArr) {
                            if (angular.isArray(chatterChatGuidsArr) && angular.isArray(localUserChatsGuidsArr) && chatterChatGuidsArr.length > 0 && chatterChatGuidsArr.length > 0) {
                                chatGuidProm = znkChatSrv.getChatGuidByTwoGuidsArray(localUserChatsGuidsArr, chatterChatGuidsArr);
                            } else {
                                chatGuidProm = znkChatSrv.createNewChat(localUseId, scope.chatterObj.uid);
                            }
                            $q.when(chatGuidProm).then(function (chatGuid) {
                                scope.chatterObj.chatMessages = [];
                                scope.chatterObj.chatGuid = chatGuid;
                                scope.chatterObj.messagesNotSeen = 0;
                                scope.setFirstChatter(scope.chatterObj);
                                _startListen(chatGuid);
                            });
                        });
                    }

                    function _startListen(chatGuid) {
                        var path = 'users/simplelogin:12333/chats/' + chatGuid + '/messages'; // todo - make function that return this path
                        znkChatEventSrv.registerEvent('child_added', path, callback);
                    }

                    function callback(snapShot) {
                        znkChatSrv.getLasSeenMessage(scope.chatterObj.chatGuid, localUseId).then(function (lastSeenMessage) {
                            var newData = snapShot.val();
                            if(!scope.chatterObj.isActive && newData.time > lastSeenMessage) { // check if there is messages the local user didn't see
                                scope.chatterObj.messagesNotSeen ++;
                            }
                            $timeout(function () {
                                scope.chatterObj.chatMessages.push(newData);
                            });
                        });
                    }

                    // callbacksToRemove = callback; todo - dont forget unregister
                }
            };
        }
    );
})(angular);

