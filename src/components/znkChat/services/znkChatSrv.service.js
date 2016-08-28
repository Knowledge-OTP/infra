(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatSrv',
        function (InfraConfigSrv, $q, UserProfileService, znkChatDataSrv, $log) {
            'ngInject';

            var self = this;
            var GLOBAL_PATH = 'users/simplelogin:12333'; // TODO -temp path
            var znkChatPaths = znkChatDataSrv.getChatPaths();

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            function _getStudentStorage() {
                return InfraConfigSrv.getStudentStorage();
            }

            function _getTeacherStorage() {
                return InfraConfigSrv.getTeacherStorage();
            }


            self.getChatParticipants = function () { // e.g teacher --> connected students
                return _getStudentStorage().then(function (studentStorage) {  // todo- 1. make a dedicated service for getting teachers
                                                                                //  todo-2. should be generic
                    var znkChatPaths = znkChatDataSrv.getChatPaths();
                    return studentStorage.get(znkChatPaths.participantsPath);

                });
            };

            self.getChatMessages = function (chatGuid) {
                return InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                   return globalStorage.get(GLOBAL_PATH + '/chats').then(function (chatObj) {
                       return chatObj[chatGuid];

                    })
                })
            };

            self.updateMessages = function(){

            };

            self.getChatGuidByTwoGuidsArray = function (chatGuidArr1, chatGuidArr2) {
                if (chatGuidArr1.length === 0 || chatGuidArr2.length === 0) {
                    return;
                }

                for (var i = 0; i < chatGuidArr1.length; i++) {
                    if (chatGuidArr2.indexOf(chatGuidArr2[i]) !== 1) {
                        return chatGuidArr2[i];
                    }
                }
            };

            self.createNewChat = function (localUid, chatterId) {
                return _getStorage().then(function (globalStorage) {
                    var localUserPath = znkChatPaths.localUserPath.replace('$$uid',localUid);
                    var chatterPath = znkChatPaths.chatterPath.replace('$$uid',chatterId);
                    var chatPath = znkChatPaths.chatPath;

                    var adapterRef = globalStorage.adapter.getRef(); // todo - get global path ?
                    var chatsRef = adapterRef.child(chatPath);
                    var localUserRef = adapterRef.child(localUserPath);
                    var chatterRef = adapterRef.child(chatterPath);

                    var chatGuid;
                    var deferred = $q.defer();
                    adapterRef.transaction(_transactionFn, _completeTransactionFn);

                    function _transactionFn() {  // todo - good way?
                        var newChatObj = _createNewChatObj(localUid, chatterId);
                        var chatsObj = {};
                        chatGuid = chatsRef.push(newChatObj).key();
                        chatsObj[chatGuid] = 1;
                        localUserRef.update(chatsObj);
                        chatterRef.update(chatsObj);
                        deferred.resolve(chatGuid);  // TODO - should returned in complete transaction function
                    }

                    function _completeTransactionFn(error) {
                        if (error) {
                            $log.error(error)
                        }
                    }

                    return deferred.promise;
                });
            };

            function _createNewChatObj(localUid, chatterId) {
                var newChatObj = {};
                newChatObj.uids = {};
                newChatObj.uids[localUid] = {
                    isTeacher: false,         // todo - hardcoded
                    messagesNotSeen: 0
                };
                newChatObj.uids[chatterId] = {
                    isTeacher: false,         // todo - hardcoded
                    messagesNotSeen: 0
                };
                newChatObj.uids.createdTime = new Date().getTime();
                return newChatObj;
            }


            // mock
            var chatParticipantsArr = [{name: 'name1', presence: 0, chatGuids: ['guid1']},
                {name: 'name2', presence: 1, chatGuids: ['guid2']},
                {name: 'name3', presence: 1, chatGuids: ['guid3']},
                {name: 'name4', presence: 2, chatGuids: ['guid4']}];

            var messages = {};
            messages.guid1 = [{uid: 1, text: 'aaaaaaaaaaaaaaaaaa'},
                {uid: 1234, text: 'bbbbbbbb'}];

            messages.guid2 = [{uid: 1, text: 'fffffffffffff'},
                {uid: 1234, text: 'ffffffffffffffff'},
                {uid: 3, text: 'ggggggggggggggggg'},
                {uid: 1234, text: 'hhhhhhhhhhhhhhhh'},
                {uid: 1, text: 'iiiiiiiiiiiiiiii'}];

            messages.guid3 = [{uid: 1, text: 'erwrwerwerwerwer'},
                {uid: 1234, text: 'jjjjjjjjjjjjjj'},
                {uid: 3, text: 'kkkkkkkkkkkkk'}];
            messages.guid4 = [{uid: 1, text: 'dsfkoosdfsdfksodfko'},
                {uid: 2, text: 'lllkodsfsdfsokddosfkl'},
                {uid: 1234, text: 'mmmmmmmmmmmmmmmmmm'}];
            // mock
        }
    );
})(angular);
