(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').provider('znkChatDataSrv',
        function () {
            'ngInject';

            var znkChatPathsObj = {};
            var buildNewChatterFnGetter;

            this.setChatPaths = function (chatPathsObj) {
                znkChatPathsObj = chatPathsObj;
            };

            this.setBuildChatterFnGetter = function (buildChatterFn) {
                buildNewChatterFnGetter = buildChatterFn;
            };

            this.$get = function ($injector) {
                var znkChat = {};

                znkChat.getChatPaths = function () {
                    return znkChatPathsObj;
                };

                znkChat.buildNewChatter = function (user, userId) {
                    var buildNewChatter = $injector.invoke(buildNewChatterFnGetter);
                    return buildNewChatter(user, userId);
                };

                return znkChat;
            };

        }
    );
})(angular);
