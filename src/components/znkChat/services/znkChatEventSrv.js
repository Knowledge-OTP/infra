(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatEventSrv',
        function ($q, InfraConfigSrv, ENV, znkChatDataSrv, ZNK_CHAT) {
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

        }
    );
})(angular);
