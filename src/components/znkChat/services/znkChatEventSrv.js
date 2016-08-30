(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatEventSrv',
        function ($q, InfraConfigSrv, znkChatSrv) {
            'ngInject';

            var self = this;
            var GLOBAL_PATH = 'users/simplelogin:12333'; // TODO -temp path

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            self.registerEvent = function (type, path, callback) {
                return _getStorage().then(function (globalStorage) {
                    var adapterRef = globalStorage.adapter.getRef(path);
                    adapterRef.orderByChild('time').on(type, callback);
                });
            };

            self.handleNotActiveChat = function (messageObj, lastSeenMessage) {
                _calcNotSeenMessages(messages, lastSeenMessage);
            };

            function _calcNotSeenMessages(messages, lastSeenMessage) {
                var numOfNotSeenMessages = 0;
                var lastSeenMessageKeys = Object(messages);
                angular.forEach(lastSeenMessageKeys, function (value) {
                    if (value.time > lastSeenMessage) {
                        numOfNotSeenMessages++;
                    }
                });
                return numOfNotSeenMessages;
            }
        }
    );
})(angular);
