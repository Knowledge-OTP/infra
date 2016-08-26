
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants', [
        function () {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatParticipants.template.html',
                scope: {
                    selectChatter:'&'
                },
                link: function (scope) {
                    scope.d = {};
                    // mock
                    scope.d.chattersArr = [{name: 'name1',presence:0}, {name: 'name2',presence:1}, {name: 'name3',presence:1}, {name: 'name4',presence:2}];
                    // mock

                }
            };
        }
    ]);
})(angular);

