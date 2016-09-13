(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatSrv',
        function (InfraConfigSrv, $q, UserProfileService, znkChatDataSrv, $log, UtilitySrv, ZNK_CHAT) {
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

            self.getChatParticipants = function () {          // e.g teacher --> connected students
                return znkChatDataSrv.getChatParticipants().then(function (participants) {
                    var chatParticipantsObj = {};
                    var supportObj = {};
                    var participantsKeys = Object.keys(participants);

                    angular.forEach(participantsKeys, function (key) {
                        if (participants[key].email === ZNK_CHAT.SUPPORT_EMAIL) {
                            supportObj = participants[key];
                            delete participants[key];
                        }
                    });

                    chatParticipantsObj.support = supportObj;
                    chatParticipantsObj.participants = participants;
                    return chatParticipantsObj;
                });
            };

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
            };

            self.createNewChat = function (localUser, secondUser) {
                return _getStorage().then(function (globalStorage) {
                    var chatPath = znkChatPaths.chatPath;
                    var chatGuid;

                    var adapterRef = globalStorage.adapter.getRef();
                    var chatsRef = adapterRef.child(chatPath);
                    var newChatObj = _createNewChatObj(localUser, secondUser);
                    chatGuid = chatsRef.push(newChatObj).key();

                    var localUserPath = localUser.isTeacher ? 'sat_dashboard/' : 'sat_app/';
                    var secondUserPath = secondUser.isTeacher ? 'sat_dashboard/' : 'sat_app/';

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
        }
    );
})(angular);
