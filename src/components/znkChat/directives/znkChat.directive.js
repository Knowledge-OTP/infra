(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat', ['$translatePartialLoader',
        function ($translatePartialLoader) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {},
                link: function (scope) {
                    $translatePartialLoader.addPart('znkChat');

                    var statesView = {
                        CHAT_BUTTON_VIEW: 1,
                        CHAT_VIEW: 2

                    };
                    scope.d = {};
                    scope.d.chatStateView = statesView.CHAT_VIEW;
                    scope.d.openChat = function () {
                        scope.chatStateView = statesView.CHAT_VIEW;
                    };

                    scope.d.selectChatter = function (chatter) {

                        scope.d.selectedChatter = chatter;
                    }
                }
            };
        }
    ]);
})(angular);

