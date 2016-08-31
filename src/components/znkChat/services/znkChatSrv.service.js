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

            self.updateChat = function (chatGuid, newMessage) {
                return _getStorage().then(function (globalStorage) {
                    var messagesPath = GLOBAL_PATH + '/' + znkChatPaths.chatPath + '/' + chatGuid + '/messages'; // todo -remove global path
                    var adapterRef = globalStorage.adapter.getRef(messagesPath);// todo - why there is no update function within storageSrv?
                    adapterRef.push(newMessage);

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
                    return globalStorage.get(notSeenMessagesPath);
                });
            };

            self.getChatGuidByTwoGuidsArray = function (chatGuidArr1, chatGuidArr2) {
                if (chatGuidArr1.length === 0 || chatGuidArr2.length === 0) {
                    return;
                }
                for (var i = 0; i < chatGuidArr1.length; i++) {
                    for(var j = 0; j < chatGuidArr2.length; j++) {
                        if (chatGuidArr1[i].indexOf(chatGuidArr2[j]) !== -1) {
                            return chatGuidArr2[j];
                        }
                    }
                }
            };


            self.createNewChat = function (localUid, chatterId) {
                return _getStorage().then(function (globalStorage) {
                    var deferred = $q.defer();
                    var chatPath = znkChatPaths.chatPath;

                    var adapterRef = globalStorage.adapter.getRef(GLOBAL_PATH); // todo - get global path ?
                    var chatsRef = adapterRef.child(chatPath);
                    var localUserPath = znkChatPaths.chatsUsersGuids.replace('$$uid', localUid); // todo - make function that returns this path
                    var chatterPath = znkChatPaths.chatsUsersGuids.replace('$$uid', chatterId); // todo - make function that returns this path

                    var localUserRef = adapterRef.child(localUserPath);
                    var chatterRef = adapterRef.child(chatterPath);

                    var chatGuid;


                    function _completeTransactionFn(error) {
                        if (error) {
                            $log.error(error);
                        }
                    }

                    function _transactionFn() {  // todo - implemented bad!!!
                        var newChatObj = _createNewChatObj(localUid, chatterId);
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

            function _createNewChatObj(localUid, chatterId) {
                var newChatObj = {};
                newChatObj.uids = {};
                newChatObj.uids[localUid] = {
                    isTeacher: false         // todo - hardcoded
                };
                newChatObj.uids[chatterId] = {
                    isTeacher: false         // todo - hardcoded
                };
                newChatObj.usersLastSeenMessage = {};
                newChatObj.usersLastSeenMessage[localUid] = 0;
                newChatObj.usersLastSeenMessage[chatterId] = 0;
                return newChatObj;
            }
        }
    );
})(angular);
