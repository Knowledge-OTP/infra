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
                        var eventType = 'child_added';
                        znkChatEventSrv.registerEvent(eventType, path, eventHandler);
                        offEvent.path = path;
                        offEvent.eventType = eventType;
                        offEvent.callback = eventHandler;
                    }

                    function eventHandler(snapShot) {
                        znkChatSrv.getLasSeenMessage(scope.chatterObj.chatGuid, scope.localUser.uid).then(function (lastSeenMessage) {
                            var newData = snapShot.val();
                            if(newData.time > lastSeenMessage) { // check if there is messages the local user didn't see
                                if(scope.chatterObj.isActive){
                                    znkChatSrv.updateLasSeenMessage(scope.chatterObj.chatGuid, scope.localUser.uid, newData.time + 1000); // todo (patch)- saving firebase time because the message time saved
                                } else {                                                                                                  // by firebase server time and firebase return local time
                                    scope.chatterObj.messagesNotSeen++;                                                                  // 1: figure why offset of 1 sec solves the problem
                                }                                                                                                        // 2: use firebase time stamp (or local current time)
                            }

                            $timeout(function () {
                                scope.chatterObj.chatMessages.push(newData);
                            });
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

