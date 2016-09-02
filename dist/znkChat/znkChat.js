(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat',
        [
            'znk.infra.svgIcon',
            'znk.infra.teachers'
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

    angular.module('znk.infra.znkChat').directive('chatMessage', [
        function () {
            'ngInject';
            return {
                template: '<div class="message-wrapper">' +
                '<div class="message">{{message.text}} <div class="bottom-triangle"></div></div>' +
                '</div>',
                scope: {
                    message: '=',
                    getLocalUserId: '&localUserId',
                    lastMessage: '&',
                    scrollToLastMessage: '&'
                },
                link: function (scope, element) {
                    var classToAdd;
                    var localUserId = scope.getLocalUserId();

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
        ["znkChatSrv", "$timeout", function (znkChatSrv, $timeout) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatBoard.template.html',
                scope: {
                    chatterObj: '=',
                    getUserId: '&userId',
                    closeChat: '&'
                },
                link: function (scope, element) {
                    var chatboardScrollElement = element[0].querySelector('.messages-wrapper');
                    scope.d = {};

                    scope.d.scrollToLastMessage = function () { // message need rendered first
                        $timeout(function () {
                            chatboardScrollElement.scrollTop = chatboardScrollElement.scrollHeight;
                        });
                    };

                    scope.userId = scope.getUserId();
                    scope.d.closeChat = scope.closeChat();
                    scope.d.sendMessage = function () {
                        if (scope.d.newMessage.length > 0) {
                            var newMessageObj = {
                                time: _getUtcTime(),
                                uid: scope.userId,
                                text: scope.d.newMessage
                            };
                            znkChatSrv.updateChat(scope.chatterObj.chatGuid, newMessageObj, scope.userId);
                            scope.d.newMessage = '';
                        }
                    };

                    function _getUtcTime(){
                        var now = new Date();
                        var utc_now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
                        return utc_now.getTime();
                    }
                }
            };
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants',
        function () {
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
                    scope.d.selectChatter = scope.selectChatter;
                }
            };
        }
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatter',
        ["znkChatSrv", "$q", "znkChatEventSrv", "$timeout", function (znkChatSrv, $q, znkChatEventSrv, $timeout) {
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
                                    znkChatSrv.updateLasSeenMessage(scope.chatterObj.chatGuid, scope.localUser.uid, lastSeenMessage); // todo (patch)- saving firebase time because the message time saved
                                } else {                                                                                                  // by firebase server time and firebase return local time
                                    scope.chatterObj.messagesNotSeen++;                                                                  // 1: figure why offset of 1 sec solves the problem
                                }                                                                                                        // 2: use firebase time stamp (or local current time)
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
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat',
        ["$translatePartialLoader", "znkChatSrv", "$q", "UtilitySrv", function ($translatePartialLoader, znkChatSrv, $q, UtilitySrv) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {
                    localUser: '='
                },
                link: function (scope) {
                    $translatePartialLoader.addPart('znkChat');
                    scope.statesView = {
                        CHAT_BUTTON_VIEW: 1,
                        CHAT_VIEW: 2
                    };
                    var localUid = scope.localUser.uid;


                    scope.d = {};
                    scope.d.selectedChatter = {};
                    scope.d.chatData = {};
                    scope.d.chatData.localUser = scope.localUser;

                    scope.d.chatStateView = scope.statesView.CHAT_VIEW;
                    scope.d.openChat = function () {
                        scope.d.chatStateView = scope.statesView.CHAT_VIEW;
                    };
                    scope.d.closeChat = function () {
                        scope.d.chatStateView = scope.statesView.CHAT_BUTTON_VIEW;
                    };

                    $q.all([znkChatSrv.getChatParticipants(), znkChatSrv.getChatGuidsByUid(localUid)]).then(function (res) {
                        scope.d.chatData.chatParticipantsArr = UtilitySrv.object.convertToArray(res[0]);
                        scope.d.chatData.localUserChatsGuidsArr = UtilitySrv.object.convertToArray(res[1]);
                    });

                    scope.d.selectChatter = function (chatter) {
                        if (scope.d.selectedChatter.isActive) {
                            scope.d.selectedChatter.isActive = false;
                        }
                        scope.d.selectedChatter = chatter;
                        scope.d.selectedChatter.isActive = true;
                        scope.d.selectedChatter.messagesNotSeen = 0;
                        if (chatter.chatMessages.length > 0) {
                            var message = chatter.chatMessages[chatter.chatMessages.length - 1];
                            var lastMessageTime = {};
                            lastMessageTime.time = message.time;
                            lastMessageTime.id = message.id;
                            scope.d.selectedChatter.lastMessageTime = lastMessageTime;
                            znkChatSrv.updateLasSeenMessage(chatter.chatGuid, localUid, lastMessageTime);
                        }
                    };
                }
            };
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').provider('znkChatDataSrv',
        function () {
            'ngInject';

            var znkChatPathsObj = {};
            var chatParticipantsGetter;

            this.setChatPaths = function (chatPathsObj) {
                znkChatPathsObj = chatPathsObj;
            };

            this.setParticipantsGetterFn = function (participantsGetterFn) {
                chatParticipantsGetter = participantsGetterFn;
            };

            this.$get = ["$injector", function ($injector) {
                var znkChat = {};

                znkChat.getChatPaths = function () {
                    return znkChatPathsObj;
                };

                znkChat.getChatParticipants = function () {
                    return $injector.invoke(chatParticipantsGetter);
                };

                return znkChat;
            }];

        }
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatEventSrv',
        ["$q", "InfraConfigSrv", function ($q, InfraConfigSrv) {
            'ngInject';

            var self = this;

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            self.registerEvent = function (type, path, callback) {
                return _getStorage().then(function (globalStorage) {
                    var adapterRef = globalStorage.adapter.getRef(path);
                    adapterRef.orderByChild('time').limitToLast(10).on(type, callback);
                });
            };

            self.offEvent = function(type, path, callback){
                return _getStorage().then(function (globalStorage) {
                    globalStorage.offEvent(type,path, callback);
                });
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
            var GLOBAL_PATH = 'users/simplelogin:12333'; // TODO -temp path
            var znkChatPaths = znkChatDataSrv.getChatPaths();

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            self.getChatParticipants = function () { // e.g teacher --> connected students
                return $q.when(znkChatDataSrv.getChatParticipants());
            };

            self.getChatByGuid = function (chatGuid) {
                return _getStorage().then(function (globalStorage) {
                    var chatPath = GLOBAL_PATH + '/' + znkChatPaths.chatPath + '/' + chatGuid; // todo -remove global path
                    return globalStorage.get(chatPath).then(function (chatObj) {
                        return chatObj;
                    });
                });
            };

            self.getChatGuidsByUid = function (uid) {
                return _getStorage().then(function (globalStorage) {
                    var chatsGuidsPath = znkChatPaths.chatsUsersGuids.replace('$$uid', uid);
                    return globalStorage.get(GLOBAL_PATH + '/' + chatsGuidsPath).then(function (chatsGuids) { //todo - remove GLOBAL_PATH
                        return UtilitySrv.object.convertToArray(chatsGuids);
                    });
                });
            };

            self.getChatMessages = function (chatGuid) {
                return _getStorage().then(function (globalStorage) {
                    return globalStorage.get(GLOBAL_PATH + '/' + znkChatPaths.chatPath).then(function (chatObj) {
                        return UtilitySrv.object.convertToArray(chatObj[chatGuid].messages);
                    });
                });
            };

            self.getMessage = function (chatGuid, messageGuid) {
                return _getStorage().then(function (globalStorage) {
                    return globalStorage.get(GLOBAL_PATH + '/' + znkChatPaths.chatPath + '/' + chatGuid + '/' + messageGuid).then(function (messageObj) {
                        return messageObj;
                    });
                });
            };

            self.updateChat = function (chatGuid, newMessage) {
                return _getStorage().then(function (globalStorage) {
                    var messagesPath = GLOBAL_PATH + '/' + znkChatPaths.chatPath + '/' + chatGuid + '/messages'; // todo -remove global path
                    var adapterRef = globalStorage.adapter.getRef(messagesPath);// todo - why there is no update function within storageSrv?
                    var messageGuid = adapterRef.push(newMessage).key();
                    return messageGuid;

                });
            };

            self.updateLasSeenMessage = function (chatGuid, userId, lastSeenMessage) {
                return _getStorage().then(function (globalStorage) {
                    var notSeenMessagesPath = GLOBAL_PATH + '/' + znkChatPaths.chatPath + '/' + chatGuid + '/usersLastSeenMessage/' + userId; // todo -remove global path
                    globalStorage.update(notSeenMessagesPath, lastSeenMessage);
                });
            };

            self.getLasSeenMessage = function (chatGuid, userId) {
                return _getStorage().then(function (globalStorage) {
                    var notSeenMessagesPath = GLOBAL_PATH + '/' + znkChatPaths.chatPath + '/' + chatGuid + '/usersLastSeenMessage/' + userId; // todo -remove global path
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
                        if (chatGuidArr1[i].indexOf(chatGuidArr2[j]) !== -1) {
                            return chatGuidArr2[j];
                        }
                    }
                }
            };


            self.createNewChat = function (localUser, secondUser) {
                return _getStorage().then(function (globalStorage) {
                    var deferred = $q.defer();
                    var chatPath = znkChatPaths.chatPath;

                    var adapterRef = globalStorage.adapter.getRef(GLOBAL_PATH); // todo - get global path ?
                    var chatsRef = adapterRef.child(chatPath);
                    var localUserPath = znkChatPaths.chatsUsersGuids.replace('$$uid', localUser.uid); // todo - make function that returns this path
                    var chatterPath = znkChatPaths.chatsUsersGuids.replace('$$uid', secondUser.uid); // todo - make function that returns this path

                    var localUserRef = adapterRef.child(localUserPath);
                    var chatterRef = adapterRef.child(chatterPath);

                    var chatGuid;

                    function _completeTransactionFn(error) {
                        if (error) {
                            $log.error(error);
                        }
                    }

                    function _transactionFn() {  // todo - implemented bad!!!
                        var newChatObj = _createNewChatObj(localUser, secondUser);
                        var userNewChatGuid = {};
                        chatGuid = chatsRef.push(newChatObj).key();
                        userNewChatGuid[chatGuid] = chatGuid;
                        $q.all([localUserRef.update(userNewChatGuid), chatterRef.update(userNewChatGuid)]).then(function () {
                            deferred.resolve(chatGuid);
                        });
                    }

                    adapterRef.transaction(_transactionFn, _completeTransactionFn);

                    return deferred.promise;
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
                    time:0
                };
                newChatObj.usersLastSeenMessage[secondCUser.uid] = {
                    time:0
                };
                return newChatObj;
            }
        }]
    );
})(angular);

angular.module('znk.infra.znkChat').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkChat/svg/znk-chat-chat-icon.svg",
    "<?xml version=\"1.0\" encoding=\"iso-8859-1\"?>\n" +
    "<svg xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     version=\"1.1\" id=\"Capa_1\"\n" +
    "     x=\"0px\" y=\"0px\"\n" +
    "     viewBox=\"0 0 477.6 477.6\"\n" +
    "     style=\"enable-background:new 0 0 477.6 477.6;\"\n" +
    "     xml:space=\"preserve\" width=\"512px\" height=\"512px\">\n" +
    "<g>\n" +
    "	<g>\n" +
    "		<path d=\"M407.583,70c-45.1-45.1-105-70-168.8-70s-123.7,24.9-168.8,70c-87,87-93.3,226-15.8,320.2c-10.7,21.9-23.3,36.5-37.6,43.5    c-8.7,4.3-13.6,13.7-12.2,23.3c1.5,9.7,8.9,17.2,18.6,18.7c5.3,0.8,11,1.3,16.9,1.3l0,0c29.3,0,60.1-10.1,85.8-27.8    c34.6,18.6,73.5,28.4,113.1,28.4c63.8,0,123.7-24.8,168.8-69.9s69.9-105.1,69.9-168.8S452.683,115.1,407.583,70z M388.483,388.5    c-40,40-93.2,62-149.7,62c-37.8,0-74.9-10.1-107.2-29.1c-2.1-1.2-4.5-1.9-6.8-1.9c-2.9,0-5.9,1-8.3,2.8    c-30.6,23.7-61.4,27.2-74.9,27.5c16.1-12,29.6-30.6,40.9-56.5c2.1-4.8,1.2-10.4-2.3-14.4c-74-83.6-70.1-211,8.9-290    c40-40,93.2-62,149.7-62s109.7,22,149.7,62C471.083,171.6,471.083,306,388.483,388.5z\" fill=\"#888c94\"/>\n" +
    "		<path d=\"M338.783,160h-200c-7.5,0-13.5,6-13.5,13.5s6,13.5,13.5,13.5h200c7.5,0,13.5-6,13.5-13.5S346.183,160,338.783,160z\" fill=\"#888c94\"/>\n" +
    "		<path d=\"M338.783,225.3h-200c-7.5,0-13.5,6-13.5,13.5s6,13.5,13.5,13.5h200c7.5,0,13.5-6,13.5-13.5S346.183,225.3,338.783,225.3z\" fill=\"#888c94\"/>\n" +
    "		<path d=\"M338.783,290.6h-200c-7.5,0-13.5,6-13.5,13.5s6,13.5,13.5,13.5h200c7.5,0,13.5-6,13.5-13.5S346.183,290.6,338.783,290.6z\" fill=\"#888c94\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
    "<g>\n" +
    "</g>\n" +
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
    "        width:13px;\n" +
    "        height:13px;\n" +
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
    "        <chatter chatter-obj=\"chatterObj\"></chatter>\n" +
    "        <svg-icon name=\"znk-chat-close-icon\" ng-click=\"d.closeChat()()\"></svg-icon>\n" +
    "    </div>\n" +
    "    <div class=\"board-wrapper\">\n" +
    "        <div class=\"messages-container\">\n" +
    "            <div class=\"messages-wrapper znk-scrollbar\">\n" +
    "                <div class=\"message-repeater\" ng-repeat=\"message in chatterObj.chatMessages | orderBy:'time'\">\n" +
    "                    <chat-message\n" +
    "                        last-message=\"$index === chatterObj.chatMessages.length-1\"\n" +
    "                        scroll-to-last-message=\"d.scrollToLastMessage\"\n" +
    "                        local-user-id=\"userId\"\n" +
    "                        message=\"message\">\n" +
    "                    </chat-message>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <textarea\n" +
    "            ng-keyup=\"$event.keyCode == 13 && d.sendMessage()\"\n" +
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
    "    <div class=\"chatter-repeater\" ng-repeat=\"chatter in d.chatData.chatParticipantsArr \">\n" +
    "        <div ng-click=\"d.selectChatter()(chatter)\">\n" +
    "            <chatter\n" +
    "                set-first-chatter=\"$index === 0 ? d.selectChatter()(chatter) : angular.noop\"\n" +
    "                chat-data=\"d.chatData\"\n" +
    "                local-user=\"d.chatData.localUser\"\n" +
    "                local-user-chats-guids-arr=\"d.chatData.localUserChatsGuidsArr\"\n" +
    "                chatter-obj=\"chatter\">\n" +
    "            </chatter>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"support-chat-wrapper\">\n" +
    "        <div class=\"online-indicator online\"></div>\n" +
    "        <div class=\"support\" translate=\".SUPPORT\"></div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkChat/templates/chatter.template.html",
    "<div class=\"chatter-wrapper\"  ng-class=\"{'offline': chatterObj.presence === d.userStatus.OFFLINE,\n" +
    "                                'online': chatterObj.presence === d.userStatus.ONLINE,\n" +
    "                                'idle': chatterObj.presence === d.userStatus.IDLE}\">\n" +
    "    <div class=\"online-indicator\"></div>\n" +
    "    <div class=\"chatter-name\">{{chatterObj.name}}</div>\n" +
    "    <div class=\"message-not-seen\" ng-if=\"chatterObj.messagesNotSeen > 0\">{{chatterObj.messagesNotSeen}}</div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkChat/templates/znkChat.template.html",
    "<div class=\"znk-chat-wrapper\" ng-switch=\"d.chatStateView\" translate-namespace=\"ZNK_CHAT\">\n" +
    "    <div class=\"button-wrapper\" ng-show=\"d.chatStateView === statesView.CHAT_BUTTON_VIEW\" ng-click=\"d.openChat()\">\n" +
    "        <svg-icon name=\"znk-chat-chat-icon\"></svg-icon>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"chat-container\" ng-show=\"d.chatStateView === statesView.CHAT_VIEW\" >\n" +
    "        <chat-participants\n" +
    "            ng-if=\"::d.chatData.localUserChatsGuidsArr\"\n" +
    "            chat-data=\"d.chatData\"\n" +
    "            select-chatter=\"d.selectChatter\">\n" +
    "        </chat-participants>\n" +
    "\n" +
    "        <chat-board\n" +
    "            user-id=\"localUser.uid\"\n" +
    "            close-chat=\"d.closeChat\"\n" +
    "            chatter-obj=\"d.selectedChatter\">\n" +
    "        </chat-board>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
