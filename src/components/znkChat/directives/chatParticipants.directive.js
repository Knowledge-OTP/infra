(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants',
        function () {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatParticipants.template.html',
                scope: {
                    selectChatter: '&',
                    chatData: '='
                },
                link: function (scope) {
                    scope.d = {};
                    scope.d.chatData = scope.chatData;
                    scope.d.selectChatter = scope.selectChatter;
                }
            };
        }
    );
})(angular);

