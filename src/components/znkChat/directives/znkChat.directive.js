/**
 * attrs:
 *  name: svg icon name
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat', ['$translatePartialLoader',
        function ($translatePartialLoader, PresenceService) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {},
                link: function (scope) {
                    $translatePartialLoader.addPart('znkChat');



                    scope.d.chatStateView = statesView.CHAT_VIEW;
                    scope.d.openChat = function () {
                        scope.chatStateView = statesView.CHAT_VIEW;
                    };

                }
            };
        }
    ]);
})(angular);

