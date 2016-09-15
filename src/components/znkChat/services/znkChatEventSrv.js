(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatEventSrv',
        function ($q, InfraConfigSrv, ENV) {
            'ngInject';

            var self = this;
            var appContext = ENV.appContext;

            var userStorageTypes = {
                STUDENT: 0,
                TEACHER: 1
            };

            function _getUserStorage(type) {
                if (type === userStorageTypes.STUDENT) {
                    return InfraConfigSrv.getStudentStorage()
                }
                if (type === userStorageTypes.TEACHER) {
                    return InfraConfigSrv.getTeacherStorage()
                }
            }

            function _getGlobalStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }


            self.registerMessagesEvent = function (type, path, callback) {
                var type = appContext === 'student' ? userStorageTypes.TEACHER : userStorageTypes.STUDENT;
                return _getGlobalStorage(type).then(function (userStorage) {
                    var adapterRef = userStorage.adapter.getRef(path);
                    adapterRef.orderByKey().limitToLast(10).on(type, callback);
                });
            };

            self.registerNewChatEvent = function (type, path, callback) {
                var type = appContext === 'student' ? userStorageTypes.TEACHER : userStorageTypes.STUDENT;
                return _getUserStorage().then(function (userStorage) {
                    var adapterRef = userStorage.adapter.getRef(path);
                    adapterRef.orderByKey().limitToLast(1).on(type, callback);
                });
            };

            self.registerNewChatterEvent = function (type, path, callback) {
                var type = appContext === 'student' ? userStorageTypes.STUDENT : userStorageTypes.TEACHER;
                return _getUserStorage().then(function (userStorage) {
                    userStorage
                });
            };

            self.offEvent = function (type, path, callback) {
                return _getStorage().then(function (globalStorage) {
                    globalStorage.offEvent(type, path, callback);
                });
            };
        }
    );
})(angular);
