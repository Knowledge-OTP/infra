(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants',
        function (znkChatSrv, UtilitySrv) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatParticipants.template.html',
                scope: {
                    selectChatter: '&',
                    chatParticipants: '=participants'
                },
                link: function (scope) {
                    scope.d = {};
                }
            };
        }
    );
})(angular);

