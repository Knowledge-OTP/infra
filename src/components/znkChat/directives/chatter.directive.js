(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatter',
        function (znkChatSrv, $q, znkChatEventSrv, $timeout, PresenceService, ZNK_CHAT, MediaSrv) {
            'ngInject';
            var presenceActiveLiseners = {};
            var soundPlaying = false;
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
                    var soundPath = ZNK_CHAT.SOUND_PATH + 'sound.mp3';
                    var sound;

                    scope.d = {};
                    scope.d.userStatus = PresenceService.userStatus;
                    scope.d.maxNumUnseenMessages = ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES;

                    function trackUserPresenceCB(newStatus, userId) {
                        $timeout(function () {
                            if (scope.chatterObj.uid === userId) {
                                scope.chatterObj.presence = newStatus;
                            }
                        });
                    }

                    if (!presenceActiveLiseners[scope.chatterObj.uid]) {
                        PresenceService.startTrackUserPresence(scope.chatterObj.uid, trackUserPresenceCB);
                        presenceActiveLiseners[scope.chatterObj.uid] = true;
                    }

                    if (scope.localUserChatsGuidsArr) {  // this directive also placed in chat board - no need for this guids array
                        scope.chatterObj.chatMessages = [];
                        scope.chatterObj.messagesNotSeen = 0;

                        znkChatSrv.getChatGuidsByUid(scope.chatterObj.uid, scope.chatterObj.isTeacher).then(function (chatterChatGuidsArr) {
                            if (angular.isArray(chatterChatGuidsArr) && angular.isArray(scope.localUserChatsGuidsArr) && scope.localUserChatsGuidsArr.length > 0 && chatterChatGuidsArr.length > 0) {
                                var chatGuid = znkChatSrv.getChatGuidByTwoGuidsArray(scope.localUserChatsGuidsArr, chatterChatGuidsArr);
                                if (angular.isDefined(chatGuid)) {
                                    chatGuidProm = chatGuid;
                                } else {
                                    chatGuidProm = _listenToNewChat();
                                }
                            } else {
                                scope.setFirstChatter(scope.chatterObj); // first chatter with no existing chat
                                chatGuidProm = _listenToNewChat();
                            }

                            $q.when(chatGuidProm).then(function (chatGuid) {
                                znkChatSrv.getLastSeenMessage(chatGuid, scope.localUser.uid).then(function (lastSeenMessage) {
                                    scope.chatterObj.chatGuid = chatGuid;
                                    scope.chatterObj.lastSeenMessage = lastSeenMessage;
                                    if(scope.setFirstChatter()){
                                        scope.setFirstChatter()(scope.chatterObj);
                                    }

                                    _startListenToMessages(chatGuid);
                                });
                            });
                        });
                    }

                    function _startListenToMessages(chatGuid) {
                        var path = 'chats/' + chatGuid + '/messages';
                        var eventType = 'child_added';
                        znkChatEventSrv.registerMessagesEvent(eventType, path, newMessageHandler);
                        offEvent.messageEvent = {};
                        offEvent.messageEvent.path = path;
                        offEvent.messageEvent.eventType = eventType;
                        offEvent.messageEvent.callback = newMessageHandler;
                    }

                    function newMessageHandler(snapShot) {
                        var newData = snapShot.val();
                        var messageId = snapShot.key();
                        if (angular.isUndefined(scope.chatterObj.lastSeenMessage.messageId) || messageId > scope.chatterObj.lastSeenMessage.messageId) { // check if there is messages the local user didn't saw
                            if (scope.chatterObj.isActive) {
                                var lastSeenMessage = {};
                                lastSeenMessage.messageId = messageId;
                                lastSeenMessage.time = newData.time;
                                scope.chatterObj.lastSeenMessage = lastSeenMessage;
                                znkChatSrv.updateLasSeenMessage(scope.chatterObj.chatGuid, scope.localUser.uid, lastSeenMessage);
                            } else {
                                scope.chatterObj.messagesNotSeen++;
                                scope.chatterObj.messagesNotSeen = scope.chatterObj.messagesNotSeen < ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES ? scope.chatterObj.messagesNotSeen :  ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES;

                                if(!soundPlaying){
                                    soundPlaying = true;
                                    sound =  MediaSrv.loadSound(soundPath,null,null,function(status){
                                      if (status === window.Media.MEDIA_STARTING && soundPlaying === true) {
                                        sound.play();
                                      }
                                    });
                                    sound.onEnded().then(function(){
                                        soundPlaying = false;
                                        sound.release();
                                    });
                                }
                            }
                        }

                        $timeout(function () {
                            if (!scope.chatterObj.chatMessages) { return; }
                            newData.id = messageId;
                            scope.chatterObj.chatMessages.push(newData);
                        });
                    }

                    function _listenToNewChat() {
                        var deferred = $q.defer();
                        var path = 'users/' + scope.chatterObj.uid + '/chats';
                        var evenType = 'value';

                        function _newChatHandler(snapshot) {
                            var newChatObj = snapshot.val();
                            if (newChatObj) {
                                znkChatSrv.getChatGuidsByUid(scope.localUser.uid, scope.localUser.isTeacher).then(function (localUserChatGuidsArr) {
                                    var newChatGuid = Object.keys(newChatObj)[0];
                                    var chatGuid = znkChatSrv.getChatGuidByTwoGuidsArray(localUserChatGuidsArr, [newChatGuid]);
                                    if (angular.isDefined(chatGuid) && chatGuid === newChatGuid) {
                                        znkChatEventSrv.offMsgOrNewChatEvent(offEvent.chatConnectionEvent.eventType, offEvent.chatConnectionEvent.path, offEvent.chatConnectionEvent.callback);
                                        deferred.resolve(newChatGuid);
                                    }
                                });
                            }
                        }

                        offEvent.chatConnectionEvent = {};
                        offEvent.chatConnectionEvent.path = path;
                        offEvent.chatConnectionEvent.eventType = evenType;
                        offEvent.chatConnectionEvent.callback = _newChatHandler;
                        znkChatEventSrv.registerNewChatEvent(evenType, path, _newChatHandler);
                        return deferred.promise;
                    }

                    scope.$on('$destroy', function () {
                        znkChatEventSrv.offMsgOrNewChatEvent(offEvent.messageEvent.eventType, offEvent.messageEvent.path, offEvent.messageEvent.callback);
                        znkChatEventSrv.offMsgOrNewChatEvent(offEvent.chatConnectionEvent.eventType, offEvent.chatConnectionEvent.path, offEvent.chatConnectionEvent.callback);
                        PresenceService.stopTrackUserPresence(scope.chatterObj.uid);
                    });
                }
            };
        }
    );
})(angular);

