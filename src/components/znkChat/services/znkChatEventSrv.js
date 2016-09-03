(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatEventSrv',
        function ($q, InfraConfigSrv) {
            'ngInject';

            var self = this;

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            self.registerMessagesEvent = function (type, path, callback) {
                return _getStorage().then(function (globalStorage) {
                    var adapterRef = globalStorage.adapter.getRef(path);
                    adapterRef.orderByChild('time').limitToLast(10).on(type, callback);
                });
            };

            self.registerNewChatEvent = function (type, path, callback) {
                return _getStorage().then(function (globalStorage) {
                    var adapterRef = globalStorage.adapter.getRef(path);
                    adapterRef.orderByKey().limitToLast(1).on(type, callback);
                });
            };

            self.offEvent = function(type, path, callback){
                return _getStorage().then(function (globalStorage) {
                    globalStorage.offEvent(type,path, callback);
                });
            };
        }
    );
})(angular);
