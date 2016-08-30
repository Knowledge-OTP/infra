(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatEventSrv',
        function ($q, InfraConfigSrv) {
            'ngInject';

            var self = this;

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            self.registerEvent = function (type, path, callback) {
                return _getStorage().then(function (globalStorage) {
                    globalStorage.onEvent(type, path, callback);
                });
            };

            self.handleNotActiveChat = function (chatObj, localUid) {
                var messages = chatObj.messages;
                var lastSeenMessage = chatObj.usersLastSeenMessage[localUid];
                var numOfNotSeenMessages = _calcNotSeenMessages(messages, lastSeenMessage);
                return numOfNotSeenMessages;
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
