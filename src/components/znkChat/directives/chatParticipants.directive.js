/**
 * attrs:
 *  name: svg icon name
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants', [
        function () {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatParticipants.template.html',
                scope: {},
                link: function (scope) {


                    scope.d = {};
                    // mock
                    scope.d.chattersArr = [{name: 'name1',presence:0}, {name: 'name2',presence:1}, {name: 'name3',presence:1}, {name: 'name4',presence:2}];
                    scope.d.userStatus = {
                        'OFFLINE': 0,
                        'ONLINE': 1,
                        'IDLE': 2
                    };
                    // mock

                    var statesView = {
                        CHAT_BUTTON_VIEW: 1,
                        CHAT_VIEW: 2

                    };


                    scope.d.chatStateView = statesView.CHAT_VIEW;
                    scope.d.openChat = function () {
                        scope.chatStateView = statesView.CHAT_VIEW;
                    };

                }
            };
        }
    ]);
})(angular);

