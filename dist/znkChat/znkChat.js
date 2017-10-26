(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat',
        [
            'znk.infra.svgIcon',
            'znk.infra.teachers',
            'znk.infra.znkMedia'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'znk-chat-chat-icon': 'components/znkChat/svg/znk-chat-chat-icon.svg',
                    'znk-chat-close-icon': 'components/znkChat/svg/znk-chat-close-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').constant('ZNK_CHAT', {
        MAX_NUM_UNSEEN_MESSAGES: 10,
        SUPPORT_EMAIL: 'support@zinkerz.com',
        STUDENT_STORAGE: 0,
        TEACHER_STORAGE: 1,
        SOUND_PATH: '/assets/sounds/'
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatMessage', [
        function () {
            'ngInject';
            return {
                template: '<div class="message-wrapper">' +
                '<div class="message-date" ng-if="d.date">{{d.date}}</div>' +
                '<div class="message">' +
                '{{message.text}}' +
                ' <div class="bottom-triangle"></div>' +
                '</div>' +
                '</div>',
                scope: {
                    message: '=',
                    getLocalUserId: '&localUserId',
                    lastMessage: '&',
                    scrollToLastMessage: '&',
                    dateGetter: '&showDate'
                },
                link: function (scope, element) {
                    var classToAdd;
                    var localUserId = scope.getLocalUserId();
                    scope.d = {};
                    var dateProm = scope.dateGetter()(scope.message.time);

                    dateProm.then(function (date) {
                        scope.d.date = date;
                    });

                    if (String(localUserId) === String(scope.message.uid)) {
                        classToAdd = 'myMessage';
                    } else {
                        classToAdd = 'otherMessage';
                    }
                    element.addClass(classToAdd);
                    scope.scrollToLastMessage()();
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatBoard',
        ["znkChatSrv", "$timeout", "$filter", function (znkChatSrv, $timeout, $filter) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatBoard.template.html',
                scope: {
                    chatterObj: '=',
                    getUserId: '&userId',
                    closeChat: '&',
                    actions:'='
                },
                link: function (scope, element) {
                    var chatBoardScrollElement = element[0].querySelector('.messages-wrapper');
                    var dateMap = {};
                    var ENTER_KEY_CODE = 13;

                    scope.d = {};

                    scope.d.scrollToLastMessage = function () {
                        $timeout(function () {                // message need rendered first
                            chatBoardScrollElement.scrollTop = chatBoardScrollElement.scrollHeight;
                        });
                    };

                    if(!scope.actions){
                        scope.actions = {};
                    }

                    scope.actions.scrollToLastMessage = scope.d.scrollToLastMessage;

                    scope.userId = scope.getUserId();

                    scope.d.closeChat = scope.closeChat();

                    scope.$watch('chatterObj', function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            dateMap = {};
                            element[0].querySelector('.chat-textarea').focus();
                        }
                    });

                    scope.d.showDate = function (timeStamp) {
                        return $timeout(function () {         // wait for chatterObj watch checked first
                            var date = $filter('date')(timeStamp, 'EEE, MMM d');
                            if (angular.isUndefined(dateMap[date])) {  // show message date only once per day.
                                dateMap[date] = date;
                                return date;
                            }
                        });
                    };

                    scope.d.sendMessage = function (e) {
                        stopBubbling(e);
                        if (e.keyCode !== ENTER_KEY_CODE) {
                            return;
                        }
                        if (scope.d.newMessage.length > 0 && angular.isDefined(scope.chatterObj) && scope.chatterObj.chatGuid) {
                            var newMessageObj = {
                                time: Firebase.ServerValue.TIMESTAMP,
                                uid: scope.userId,
                                text: scope.d.newMessage
                            };
                            znkChatSrv.updateChat(scope.chatterObj.chatGuid, newMessageObj, scope.userId);
                            scope.d.newMessage = '';
                        }

                    };

                    function stopBubbling(e) {
                        if (e.stopPropagation) {
                            e.stopPropagation();
                        }
                        if (e.cancelBubble !== null) {
                            e.cancelBubble = true;
                        }
                    }
                }
            };
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants',
        ["znkChatDataSrv", "znkChatEventSrv", "ZNK_CHAT", function (znkChatDataSrv, znkChatEventSrv, ZNK_CHAT) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatParticipants.template.html',
                scope: {
                    selectChatter: '&',
                    chatData: '='
                },
                link: function (scope) {
                    scope.d = {};
                    scope.d.chatData = scope.chatData;
                    scope.d.selectChatter = scope.selectChatter();
                    scope.d.chatData.chatParticipantsArr = [];
                    var chatPaths = znkChatDataSrv.getChatPaths();
                    var localUserUid = scope.d.chatData.localUser.uid;
                    var chattersPath = chatPaths.newChatParticipantsListener;
                    chattersPath = chattersPath.replace('$$uid', localUserUid);

                    var newChatterHandler = function (newChatter) {
                        if (newChatter.email === ZNK_CHAT.SUPPORT_EMAIL) {
                            if(angular.isUndefined(scope.d.chatData.support)) { // todo - temporary fix (for some reason the callback called twice)
                                scope.d.chatData.support = newChatter;
                            }
                        } else {
                            scope.d.chatData.chatParticipantsArr.push(newChatter);
                        }
                    };
                    znkChatEventSrv.getChattersListener(chattersPath, newChatterHandler);

                    scope.$on('$destroy', function () {
                        znkChatEventSrv.offNewChatterEvent(chattersPath);
                    });
                }
            };
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatter',
        ["znkChatSrv", "$q", "znkChatEventSrv", "$timeout", "PresenceService", "ZNK_CHAT", "MediaSrv", function (znkChatSrv, $q, znkChatEventSrv, $timeout, PresenceService, ZNK_CHAT, MediaSrv) {
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

                    var audioLoadRetry = 1;
                    
                    var audioSucessFn = function() {
                      audioLoadRetry = 1;
                    };
                                
                    var audioStatusChangeFn = function(status) {
                      if (status === window.Media.MEDIA_STARTING && soundPlaying === true) {
                        sound.play();
                      } else if (status === window.Media.MEDIA_STOPPED) {
                        sound.release();
                      }
                    };

                    var audioErrFn = function() {
                      console.log('znkChat loadSound failed #' + audioLoadRetry);
                      sound.release();
                      if (audioLoadRetry <= 3) {
                        audioLoadRetry++;
                        sound = MediaSrv.loadSound(
                          soundPath,
                          audioSucessFn,
                          audioErrFn,
                          audioStatusChangeFn
                        );
                      }
                    };

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
                                    sound = MediaSrv.loadSound(
                                      soundPath,
                                      audioSucessFn,
                                      audioErrFn,
                                      audioStatusChangeFn
                                    );
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
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat',
        ["znkChatSrv", "$q", "UtilitySrv", "ZNK_CHAT", "$timeout", function (znkChatSrv, $q, UtilitySrv, ZNK_CHAT, $timeout) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {
                    localUser: '='
                },
                link: function (scope, element) {
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
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatSrv',
        ["InfraConfigSrv", "$q", "UserProfileService", "znkChatDataSrv", "$log", "UtilitySrv", function (InfraConfigSrv, $q, UserProfileService, znkChatDataSrv, $log, UtilitySrv) {
            'ngInject';

            var self = this;
            var znkChatPaths = znkChatDataSrv.getChatPaths();

            function _getUserStorage(isTeacher) {
                if (isTeacher) {
                    return InfraConfigSrv.getTeacherStorage();
                } else {
                    return InfraConfigSrv.getStudentStorage();
                }
            }

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            self.getChatGuidsByUid = function (uid, isTeacher) {
                return _getUserStorage(isTeacher).then(function (userStorage) {
                    var chatsGuidsPath = znkChatPaths.chatsUsersGuids.replace('$$uid', uid);
                    return userStorage.get(chatsGuidsPath).then(function (chatsGuids) {
                        return UtilitySrv.object.convertToArray(chatsGuids);
                    });
                });
            };

            self.updateChat = function (chatGuid, newMessage) {
                return _getStorage().then(function (globalStorage) {
                    var messagesPath = znkChatPaths.chatPath + '/' + chatGuid + '/messages';
                    var adapterRef = globalStorage.adapter.getRef(messagesPath);
                    var messageGuid = adapterRef.push(newMessage).key();
                    return messageGuid;

                });
            };

            self.updateLasSeenMessage = function (chatGuid, userId, lastSeenMessage) {
                return _getStorage().then(function (globalStorage) {
                    var notSeenMessagesPath = znkChatPaths.chatPath + '/' + chatGuid + '/usersLastSeenMessage/' + userId;
                    globalStorage.update(notSeenMessagesPath, lastSeenMessage);
                });
            };

            self.getLastSeenMessage = function (chatGuid, userId) {
                return _getStorage().then(function (globalStorage) {
                    var notSeenMessagesPath = znkChatPaths.chatPath + '/' + chatGuid + '/usersLastSeenMessage/' + userId;
                    return globalStorage.get(notSeenMessagesPath).then(function (lastSeenMessage) {
                        return lastSeenMessage;
                    });
                });
            };

            self.getChatGuidByTwoGuidsArray = function (chatGuidArr1, chatGuidArr2) {
                if (chatGuidArr1.length === 0 || chatGuidArr2.length === 0) {
                    return;
                }
                for (var i = 0; i < chatGuidArr1.length; i++) {
                    for (var j = 0; j < chatGuidArr2.length; j++) {
                        if (chatGuidArr1[i] === chatGuidArr2[j]) {
                            return chatGuidArr2[j];
                        }
                    }
                }
                return undefined;
            };

            self.createNewChat = function (localUser, secondUser) {
                return _getStorage().then(function (globalStorage) {
                    var chatPath = znkChatPaths.chatPath;
                    var chatGuid;

                    var adapterRef = globalStorage.adapter.getRef();
                    var chatsRef = adapterRef.child(chatPath);
                    var newChatObj = _createNewChatObj(localUser, secondUser);
                    chatGuid = chatsRef.push(newChatObj).key();

                    var localUserPath = localUser.isTeacher ? znkChatPaths.dashboardAppName + '/' : znkChatPaths.studentAppName + '/';
                    var secondUserPath = secondUser.isTeacher ? znkChatPaths.dashboardAppName + '/' : znkChatPaths.studentAppName + '/';

                    localUserPath += znkChatPaths.chatsUsersGuids.replace('$$uid', localUser.uid);
                    secondUserPath += znkChatPaths.chatsUsersGuids.replace('$$uid', secondUser.uid);

                    var localUserRef = adapterRef.child(localUserPath);
                    var chatterRef = adapterRef.child(secondUserPath);

                    var userNewChatGuid = {};
                    userNewChatGuid[chatGuid] = chatGuid;

                    var localUserWriteChatGuidsProm = localUserRef.update(userNewChatGuid);
                    var secondUserWriteChatGuidsProm = chatterRef.update(userNewChatGuid);
                    return $q.all([localUserWriteChatGuidsProm, secondUserWriteChatGuidsProm]).then(function () {
                        return chatGuid;
                    }, function (error) {
                        $log.error('znkChat: error while creating new chat: ' + error);
                    });
                });
            };

            function _createNewChatObj(firstUser, secondCUser) {
                var newChatObj = {};
                newChatObj.uids = {};
                newChatObj.uids[firstUser.uid] = {
                    isTeacher: firstUser.isTeacher
                };
                newChatObj.uids[secondCUser.uid] = {
                    isTeacher: secondCUser.isTeacher
                };
                newChatObj.usersLastSeenMessage = {};
                newChatObj.usersLastSeenMessage[firstUser.uid] = {
                    time: 0
                };
                newChatObj.usersLastSeenMessage[secondCUser.uid] = {
                    time: 0
                };
                return newChatObj;
            }
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').provider('znkChatDataSrv',
        function () {
            'ngInject';

            var znkChatPathsObj = {};
            var buildNewChatterFnGetter;

            this.setChatPaths = function (chatPathsObj) {
                znkChatPathsObj = chatPathsObj;
            };

            this.setBuildChatterFnGetter = function (buildChatterFn) {
                buildNewChatterFnGetter = buildChatterFn;
            };

            this.$get = ["$injector", function ($injector) {
                var znkChat = {};

                znkChat.getChatPaths = function () {
                    return znkChatPathsObj;
                };

                znkChat.buildNewChatter = function (user, userId) {
                    var buildNewChatter = $injector.invoke(buildNewChatterFnGetter);
                    return buildNewChatter(user, userId);
                };

                return znkChat;
            }];

        }
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatEventSrv',
        ["$q", "InfraConfigSrv", "ENV", "znkChatDataSrv", "ZNK_CHAT", function ($q, InfraConfigSrv, ENV, znkChatDataSrv, ZNK_CHAT) {
            'ngInject';

            var self = this;
            var appContext = ENV.appContext;
            var oppositeStorageType = appContext === 'student' ? ZNK_CHAT.TEACHER_STORAGE : ZNK_CHAT.STUDENT_STORAGE;
            var storageType = appContext === 'student' ? ZNK_CHAT.STUDENT_STORAGE : ZNK_CHAT.TEACHER_STORAGE;

            var studentStorage = InfraConfigSrv.getStudentStorage();
            var teacherStorage = InfraConfigSrv.getTeacherStorage();
            function _getUserStorage(type) {
                if (type === ZNK_CHAT.STUDENT_STORAGE) {
                    return studentStorage;
                }
                if (type === ZNK_CHAT.TEACHER_STORAGE) {
                    return teacherStorage;
                }
            }

            function _getGlobalStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            self.registerMessagesEvent = function (type, path, callback) {
                return _getGlobalStorage(oppositeStorageType).then(function (userStorage) {
                    var adapterRef = userStorage.adapter.getRef(path);
                    adapterRef.orderByKey().limitToLast(10).on(type, callback);
                });
            };

            self.registerNewChatEvent = function (type, path, callback) {
                return _getUserStorage(oppositeStorageType).then(function (userStorage) {
                    var adapterRef = userStorage.adapter.getRef(path);
                    adapterRef.orderByKey().limitToLast(1).on(type, callback);
                });
            };

            var getChattersCb;
            function _buildChatterObject(callback) {
                if (angular.isUndefined(getChattersCb)) {
                    getChattersCb = function (user, UserUid) {
                        znkChatDataSrv.buildNewChatter(user, UserUid).then(function (newChatter) {
                            callback(newChatter);
                        });
                    };
                }
                return getChattersCb;
            }

            self.getChattersListener = function (path, callback) {
                return _getUserStorage(storageType).then(function (userStorage) {
                    userStorage.onEvent('child_added', path, _buildChatterObject(callback));
                });
            };

            self.offMsgOrNewChatEvent = function (type, path, callback) {
                return _getUserStorage(oppositeStorageType).then(function (userStorage) {
                    var userStorageRef = userStorage.adapter.getRef();  // the event was registered outside storageSrv so it must unregistered outside also
                    var eventPath = userStorageRef.child(path);
                    eventPath.off(type, callback);
                });
            };

            self.offNewChatterEvent = function (path) {
                return _getUserStorage(storageType).then(function (userStorage) {
                    userStorage.offEvent('child_added', path, getChattersCb);
                });
            };

        }]
    );
})(angular);

angular.module('znk.infra.znkChat').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkChat/svg/znk-chat-chat-icon.svg",
    "<svg\n" +
    "    id=\"Layer_1\"\n" +
    "    xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "    x=\"0px\" y=\"0px\"\n" +
    "    viewBox=\"0 0 200 178.1\"\n" +
    "    class=\"znk-chat-chat-icon\">\n" +
    "    <style>\n" +
    "        .znk-chat-chat-icon{\n" +
    "        width:25px;\n" +
    "        height:25px;\n" +
    "        enable-background:new 0 0 200 178.1;\n" +
    "        }\n" +
    "    </style>\n" +
    "\n" +
    "    <g id=\"XMLID_14_\">\n" +
    "        <path id=\"XMLID_42_\" d=\"M2.4,71.1c1.6-5.4,2.7-11,5-16.2c9.7-22.2,27.1-36.4,49.2-44.5C98.3-4.8,137.7-0.4,172.8,28.2\n" +
    "		c13.1,10.7,21.4,24.6,24.1,41.7c0.1,0.4,0.5,0.8,0.7,1.2c0,4.9,0,9.8,0,14.6c-1.5,5.1-2.6,10.4-4.6,15.3\n" +
    "		c-8.3,20.4-23.8,33.8-43.2,42.9c-21.8,10.3-44.7,13.1-68.5,9.6c-2.3-0.3-4.9,0.1-7,0.9c-17.8,7-35.6,14.2-53.4,21.2\n" +
    "		c-1.9,0.7-4.2,0.4-6.4,0.6c-0.2-2.3-0.9-4.7-0.4-6.8c3.2-12.9,6.7-25.8,9.8-38.7c0.4-1.6,0.1-4-0.9-5.1C12.6,114.8,5.4,102.2,3,87\n" +
    "		c-0.1-0.5-0.4-0.9-0.6-1.3C2.4,80.9,2.4,76,2.4,71.1z M22.3,167.2c2.4-0.9,3.9-1.3,5.3-1.9c15.5-6.2,31-12.4,46.6-18.6\n" +
    "		c1.6-0.6,3.4-1.1,5.1-1c5.8,0.5,11.6,1.7,17.4,1.8c26,0.6,50.1-5.3,70.3-22.4c19-16.1,27.7-36.3,21.2-61.2\n" +
    "		c-5-19.1-18.1-32-34.8-41.3c-20.6-11.4-42.8-14.7-66-12.5c-18.4,1.8-35.5,7.6-50.5,18.8C22.5,39.6,12.6,53.3,10.2,71.4\n" +
    "		c-2.5,19.9,4.8,36.3,19,49.9c3,2.9,3.8,5.4,2.6,9.4c-1.8,5.7-3.1,11.6-4.6,17.4C25.6,154.1,24.1,160.2,22.3,167.2z\"/>\n" +
    "        <path id=\"XMLID_36_\" d=\"M103.6,62.3c-14.1,0-28.3,0-42.4,0c-1.1,0-2.5,0.4-3.4-0.1c-1.4-0.9-3.1-2.3-3.5-3.7\n" +
    "		c-0.2-0.8,1.9-2.5,3.3-3.3c0.8-0.5,2.2-0.2,3.4-0.2c28.6,0,57.2,0,85.8,0c1,0,2.2-0.3,2.9,0.1c1.4,1,2.5,2.4,3.8,3.7\n" +
    "		c-1.3,1.2-2.6,3.2-4,3.3c-4.3,0.4-8.8,0.2-13.1,0.2C125.4,62.3,114.5,62.3,103.6,62.3z\"/>\n" +
    "        <path id=\"XMLID_35_\" d=\"M104,76c14.5,0,28.9,0,43.4,0c2.7,0,5.8-0.1,5.9,3.4c0.2,3.9-3.1,3.8-6,3.8c-29.1,0-58.2,0-87.2,0\n" +
    "		c-2.6,0-5.8,0.3-5.9-3.4c-0.1-4,3.1-3.8,5.9-3.8C74.8,76,89.4,76,104,76z\"/>\n" +
    "        <path id=\"XMLID_34_\" d=\"M86.8,104.2c-8.9,0-17.9,0-26.8,0c-2.7,0-5.7,0-5.8-3.5c-0.2-3.7,2.8-3.8,5.5-3.8c18.2,0,36.4,0,54.6,0\n" +
    "		c2.5,0,5.2,0.1,5.3,3.5c0.1,3.7-2.7,3.8-5.5,3.8C105,104.2,95.9,104.2,86.8,104.2z\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkChat/svg/znk-chat-close-icon.svg",
    "<svg\n" +
    "    x=\"0px\"\n" +
    "    y=\"0px\"\n" +
    "    class=\"znk-chat-close-icon\"\n" +
    "    viewBox=\"-596.6 492.3 133.2 133.5\">\n" +
    "    <style>\n" +
    "        .znk-chat-close-icon {\n" +
    "        width:12px;\n" +
    "        height:12px;\n" +
    "        }\n" +
    "    </style>\n" +
    "    <path class=\"st0\"/>\n" +
    "    <g>\n" +
    "        <line class=\"st1\" x1=\"-592.6\" y1=\"496.5\" x2=\"-467.4\" y2=\"621.8\"/>\n" +
    "        <line class=\"st1\" x1=\"-592.6\" y1=\"621.5\" x2=\"-467.4\" y2=\"496.3\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkChat/templates/chatBoard.template.html",
    "<div class=\"chat-board-wrapper\">\n" +
    "    <div class=\"chat-board-header\">\n" +
    "        <chatter ng-if=\"chatterObj.uid\" chatter-obj=\"chatterObj\"></chatter>\n" +
    "        <svg-icon name=\"znk-chat-close-icon\" ng-click=\"d.closeChat()\"></svg-icon>\n" +
    "    </div>\n" +
    "    <div class=\"board-wrapper\">\n" +
    "        <div class=\"messages-container\">\n" +
    "            <div class=\"messages-wrapper znk-scrollbar\">\n" +
    "                <div class=\"message-repeater\" ng-repeat=\"message in chatterObj.chatMessages | orderBy:'time'\">\n" +
    "                    <chat-message\n" +
    "                        show-date=\"d.showDate\"\n" +
    "                        last-message=\"$index === chatterObj.chatMessages.length-1\"\n" +
    "                        scroll-to-last-message=\"d.scrollToLastMessage\"\n" +
    "                        local-user-id=\"userId\"\n" +
    "                        message=\"message\">\n" +
    "                    </chat-message>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <textarea class=\"chat-textarea\"\n" +
    "            placeholder=\"{{ 'ZNK_CHAT.PLACEHOLDER' | translate }}\"\n" +
    "            ng-keydown=\"d.sendMessage($event)\"\n" +
    "            ng-model=\"d.newMessage\">\n" +
    "            </textarea>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkChat/templates/chatParticipants.template.html",
    "<div class=\"chat-participants\">\n" +
    "    <div class=\"my-chat-title\" translate=\".MY_CHAT\"></div>\n" +
    "\n" +
    "    <div class=\"chatter-drv-wrapper support-chat-wrapper\"\n" +
    "         ng-click=\"d.selectChatter(d.chatData.support)\"\n" +
    "         ng-if=\"d.chatData.support && d.chatData.support.uid\"\n" +
    "         ng-class=\"{'selected-chatter': d.chatData.support.isActive}\">\n" +
    "        <chatter\n" +
    "            set-first-chatter=\"!d.chatData.chatParticipantsArr || d.chatData.chatParticipantsArr.length === 0 ?  d.selectChatter : null\"\n" +
    "            chat-data=\"d.chatData\"\n" +
    "            local-user=\"d.chatData.localUser\"\n" +
    "            local-user-chats-guids-arr=\"d.chatData.localUserChatsGuidsArr\"\n" +
    "            chatter-obj=\"d.chatData.support\">\n" +
    "        </chatter>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"chatter-repeater-wrapper znk-scrollbar\">\n" +
    "        <div class=\"chatter-repeater\" ng-repeat=\"chatter in d.chatData.chatParticipantsArr | orderBy:'name' | orderBy:'-messagesNotSeen'\">\n" +
    "            <div class=\"chatter-drv-wrapper\"\n" +
    "                 ng-click=\"d.selectChatter(chatter)\"\n" +
    "                 ng-class=\"{'selected-chatter': chatter.isActive}\">\n" +
    "                <chatter\n" +
    "                    set-first-chatter=\"$index === 0  ? d.selectChatter : null\"\n" +
    "                    chat-data=\"d.chatData\"\n" +
    "                    local-user=\"d.chatData.localUser\"\n" +
    "                    local-user-chats-guids-arr=\"d.chatData.localUserChatsGuidsArr\"\n" +
    "                    chatter-obj=\"chatter\">\n" +
    "                </chatter>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkChat/templates/chatter.template.html",
    "<div class=\"chatter-wrapper\"\n" +
    "     ng-class=\"{'offline': chatterObj.presence === d.userStatus.OFFLINE,\n" +
    "     'online': chatterObj.presence === d.userStatus.ONLINE,\n" +
    "     'idle': chatterObj.presence === d.userStatus.IDLE}\">\n" +
    "    <div class=\"online-indicator\"></div>\n" +
    "    <div class=\"chatter-name\">{{chatterObj.name}}</div>\n" +
    "    <div class=\"message-not-seen\"\n" +
    "         ng-class=\"{'ten-or-more-unseen-messages': chatterObj.messagesNotSeen >= d.maxNumUnseenMessages}\"\n" +
    "         ng-if=\"chatterObj.messagesNotSeen > 0\">\n" +
    "        {{chatterObj.messagesNotSeen}}\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkChat/templates/znkChat.template.html",
    "<div class=\"znk-chat-wrapper\" ng-switch=\"d.chatStateView\" translate-namespace=\"ZNK_CHAT\">\n" +
    "    <div class=\"button-wrapper\" ng-show=\"d.chatStateView === statesView.CHAT_BUTTON_VIEW\" ng-click=\"d.openChat()\">\n" +
    "        <div class=\"unseen-messages\"\n" +
    "             ng-class=\"{'ten-or-more-unseen-messages': d.numOfNotSeenMessages >=  d.maxNumUnseenMessages}\"\n" +
    "             ng-if=\"d.numOfNotSeenMessages > 0\">\n" +
    "            {{d.numOfNotSeenMessages}}\n" +
    "        </div>\n" +
    "        <svg-icon name=\"znk-chat-chat-icon\"></svg-icon>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"chat-container\" ng-show=\"d.chatStateView === statesView.CHAT_VIEW\">\n" +
    "        <chat-participants\n" +
    "            ng-if=\"::d.chatData.localUserChatsGuidsArr\"\n" +
    "            chat-data=\"d.chatData\"\n" +
    "            select-chatter=\"d.selectChatter\">\n" +
    "        </chat-participants>\n" +
    "\n" +
    "        <chat-board\n" +
    "            actions=\"d.actions\"\n" +
    "            user-id=\"localUser.uid\"\n" +
    "            close-chat=\"d.closeChat\"\n" +
    "            chatter-obj=\"d.selectedChatter\">\n" +
    "        </chat-board>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
