/**
 * attrs:
 *  name: svg icon name
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat', [
        function () {
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {},
                link: function(scope){
                    var statesView = {
                        CHAT_VIEW: 1,
                        CHAT_BUTTON_VIEW: 2
                    };

                    scope.chatStateView = statesView.CHAT_VIEW;
                }
            };
        }
    ]);
})(angular);

