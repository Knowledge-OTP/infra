(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').provider('znkChatDataSrv',
        function ($injector) {
            'ngInject';

            var znkChatPathsObj = {};
            var chatParticipantsGetter;

            this.setChatPaths = function (chatPathsObj) {
                znkChatPathsObj = chatPathsObj;
            };

            this.setParticipantsGetterFn = function (participantsGetterFn) {
                chatParticipantsGetter = participantsGetterFn;
            };

            this.$get = function ($injector) {
                var znkChat = {};

                znkChat.getChatPaths = function () {
                    return znkChatPathsObj;
                };

                znkChat.getChatParticipants = function () {
                    return $injector.invoke(chatParticipantsGetter);
                };

                return znkChat;
            }

        }
    );
})(angular);
