(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatSrv',
        function (InfraConfigSrv, $q, UserProfileService, znkChatDataSrv, $log, UtilitySrv) {
            'ngInject';

            var self = this;
            var znkChatPaths = znkChatDataSrv.getChatPaths();

            function _getUserStorage(isTeacher){
                if(isTeacher){
                    return InfraConfigSrv.getTeacherStorage();
                } else{
                    return InfraConfigSrv.getStudentStorage();
                }
            }

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            self.getChatParticipants = function () { // e.g teacher --> connected students
                return $q.when(znkChatDataSrv.getChatParticipants());
            };

            self.getChatByGuid = function (chatGuid) {
                return _getStorage().then(function (globalStorage) {
                    var chatPath = znkChatPaths.chatPath + '/' + chatGuid; // todo -remove global path
                    return globalStorage.get(chatPath).then(function (chatObj) {
                        return chatObj;
                    });
                });
            };

            self.getChatGuidsByUid = function (userObj) {
                return _getUserStorage(userObj.isTeacher).then(function (userStorage) {                     // todo - check if student or teacher
                    var chatsGuidsPath = znkChatPaths.chatsUsersGuids.replace('$$uid', userObj.uid);  // todo - can remove the replace
                    return userStorage.get(chatsGuidsPath).then(function (chatsGuids) {
                        return UtilitySrv.object.convertToArray(chatsGuids);
                    });
                });
            };

            self.getChatMessages = function (chatGuid) {
                return _getStorage().then(function (globalStorage) {
                    return globalStorage.get(znkChatPaths.chatPath).then(function (chatObj) {
                        return UtilitySrv.object.convertToArray(chatObj[chatGuid].messages);
                    });
                });
            };

            self.getMessage = function (chatGuid, messageGuid) {
                return _getStorage().then(function (globalStorage) {
                    return globalStorage.get(znkChatPaths.chatPath + '/' + chatGuid + '/' + messageGuid).then(function (messageObj) {
                        return messageObj;
                    });
                });
            };

            self.updateChat = function (chatGuid, newMessage) {
                return _getStorage().then(function (globalStorage) {
                    var messagesPath = znkChatPaths.chatPath + '/' + chatGuid + '/messages';
                    var adapterRef = globalStorage.adapter.getRef(messagesPath);// todo - why there is no update function within storageSrv?
                    var messageGuid = adapterRef.push(newMessage).key();
                    return messageGuid;

                });
            };

            self.updateLasSeenMessage = function (chatGuid, userId, lastSeenMessage) {
                return _getStorage().then(function (globalStorage) {
                    var notSeenMessagesPath = znkChatPaths.chatPath + '/' + chatGuid + '/usersLastSeenMessage/' + userId; // todo -remove global path
                    globalStorage.update(notSeenMessagesPath, lastSeenMessage);
                });
            };

            self.getLastSeenMessage = function (chatGuid, userId) {
                return _getStorage().then(function (globalStorage) {
                    var notSeenMessagesPath =  znkChatPaths.chatPath + '/' + chatGuid + '/usersLastSeenMessage/' + userId; // todo -remove global path
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
                        if (chatGuidArr1[i].chatGuid === chatGuidArr2[j].chatGuid) {
                            return chatGuidArr2[j].chatGuid;
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
                     localUserPath += znkChatPaths.chatsUsersGuids.replace('$$uid', localUser.uid); // todo - make function that returns this path
                     secondUserPath += znkChatPaths.chatsUsersGuids.replace('$$uid', secondUser.uid); // todo - make function that returns this path

                    var localUserRef = adapterRef.child(localUserPath);
                    var chatterRef = adapterRef.child(secondUserPath);

                    var localUserChatObj = {};
                    localUserChatObj[chatGuid] = {
                        uids: secondUser.uid,         // todo - how to call this property?
                        chatGuid: chatGuid
                    };

                    var secondUserChatObj = {};
                    secondUserChatObj[chatGuid] = {
                        uids: localUser.uid,         // todo - how to call this property?
                        chatGuid: chatGuid
                    };

                    var localUserWriteChatGuidsProm = localUserRef.update(localUserChatObj);
                    var secondUserWriteChatGuidsProm = chatterRef.update(secondUserChatObj);
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
