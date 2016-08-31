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
                    localUser: '=',
                    setFirstChatter: '&?'
                },
                link: function (scope) {
                    var chatGuidProm;
                    // var callbacksToRemove;

                    if (scope.localUserChatsGuidsArr) {  // this directive also placed in chat board - no need for this guids array
                        var localUserChatsGuidsArr = scope.localUserChatsGuidsArr;

                        znkChatSrv.getChatGuidsByUid(scope.chatterObj.uid).then(function (chatterChatGuidsArr) {
                            if (angular.isArray(chatterChatGuidsArr) && angular.isArray(localUserChatsGuidsArr) && chatterChatGuidsArr.length > 0 && chatterChatGuidsArr.length > 0) {
                                chatGuidProm = znkChatSrv.getChatGuidByTwoGuidsArray(localUserChatsGuidsArr, chatterChatGuidsArr);
                            } else {
                                chatGuidProm = znkChatSrv.createNewChat(scope.localUser, scope.chatterObj);
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
                        znkChatEventSrv.registerEvent('child_added', path, eventHandler);
                    }

                    function eventHandler(snapShot) {
                        znkChatSrv.getLasSeenMessage(scope.chatterObj.chatGuid, scope.localUser.uid).then(function (lastSeenMessage) {
                            var newData = snapShot.val();
                            if(!scope.chatterObj.isActive && newData.time > lastSeenMessage) { // check if there is messages the local user didn't see
                                scope.chatterObj.messagesNotSeen++;
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

