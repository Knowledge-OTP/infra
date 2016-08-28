(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').provider('znkChatDataSrv',
        function () {
            'ngInject';

            var pathsObj = {};

            this.setChatPath = function (path) {
                pathsObj.chatPath = path;
            };

            this.setParticipantsPath = function (path) {
                pathsObj.participantsPath = path;
            };

            this.$get = function () {
                var znkChat = {};

                znkChat.getChatPaths = function () {
                    return pathsObj;
                };

                return znkChat;
            }

        }
    );
})(angular);
