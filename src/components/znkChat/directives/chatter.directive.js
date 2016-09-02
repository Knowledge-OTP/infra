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
                    var offEvent = {};

                    if (scope.localUserChatsGuidsArr) {  // this directive also placed in chat board - no need for this guids array
                        var localUserChatsGuidsArr = scope.localUserChatsGuidsArr;

                        znkChatSrv.getChatGuidsByUid(scope.chatterObj.uid).then(function (chatterChatGuidsArr) {
                            if (angular.isArray(chatterChatGuidsArr) && angular.isArray(localUserChatsGuidsArr) && chatterChatGuidsArr.length > 0 && chatterChatGuidsArr.length > 0) {
                                chatGuidProm = znkChatSrv.getChatGuidByTwoGuidsArray(localUserChatsGuidsArr, chatterChatGuidsArr);
                            } else {
                                chatGuidProm = znkChatSrv.createNewChat(scope.localUser, scope.chatterObj);
                            }
                            $q.when(chatGuidProm).then(function (chatGuid) {
                                znkChatSrv.getLasSeenMessage(chatGuid, scope.localUser.uid).then(function (lastSeenMessage) {
                                    scope.chatterObj.chatMessages = [];
                                    scope.chatterObj.chatGuid = chatGuid;
                                    scope.chatterObj.messagesNotSeen = 0;
                                    scope.chatterObj.lastSeenMessage = lastSeenMessage;
                                    scope.setFirstChatter(scope.chatterObj);
                                    _startListen(chatGuid);
                                });
                            });
                        });
                    }

                    function _startListen(chatGuid) {
                        var path = 'users/simplelogin:12333/chats/' + chatGuid + '/messages'; // todo - make function that return this path
                        var eventType = 'child_added';
                        znkChatEventSrv.registerEvent(eventType, path, eventHandler);
                        offEvent.path = path;
                        offEvent.eventType = eventType;
                        offEvent.callback = eventHandler;
                    }

                    function eventHandler(snapShot) {
                            var newData = snapShot.val();
                            var messageId = snapShot.key();
                            if(newData.time > scope.chatterObj.lastSeenMessage.time) { // check if there is messages the local user didn't see
                                if(scope.chatterObj.isActive){
                                    var lastSeenMessage = {};
                                    lastSeenMessage.id = messageId;
                                    lastSeenMessage.time = newData.time;
                                    scope.chatterObj.lastSeenMessage = lastSeenMessage;
                                    znkChatSrv.updateLasSeenMessage(scope.chatterObj.chatGuid, scope.localUser.uid, lastSeenMessage); 
                                } else {                                                                                                  
                                    scope.chatterObj.messagesNotSeen++;                                                                  
                                }                                                                                                        
                            }

                            $timeout(function () {
                                newData.id = messageId;
                                scope.chatterObj.chatMessages.push(newData);
                            });
                    }

                    scope.$on('$destroy', function() {
                        znkChatSrv.offEvent(offEvent.eventType,offEvent.path, offEvent.callback);
                    });
                }
            };
        }
    );
})(angular);

