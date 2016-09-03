(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatSrv',
        function (InfraConfigSrv, $q, UserProfileService, znkChatDataSrv, $log, UtilitySrv) {
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
                    var chatPath = znkChatPaths.chatPath;
                    var chatGuid;

                    var adapterRef = globalStorage.adapter.getRef(GLOBAL_PATH); // todo -remove GLOBAL
                    var chatsRef = adapterRef.child(chatPath);
                    var newChatObj = _createNewChatObj(localUser, secondUser);
                    chatGuid = chatsRef.push(newChatObj).key();

                    var localUserPath = znkChatPaths.chatsUsersGuids.replace('$$uid', localUser.uid); // todo - make function that returns this path
                    var secondUserPath = znkChatPaths.chatsUsersGuids.replace('$$uid', secondUser.uid); // todo - make function that returns this path

                    var localUserRef = adapterRef.child(localUserPath);
                    var chatterRef = adapterRef.child(secondUserPath);

                    var userNewChatGuidObj = {};
                    userNewChatGuidObj[chatGuid] = chatGuid;

                    var localUserWriteChatGuidsProm = localUserRef.update(userNewChatGuidObj); // todo -remove GLOBAL
                    var secondUserWriteChatGuidsProm = chatterRef.update(userNewChatGuidObj); // todo -remove GLOBAL
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
