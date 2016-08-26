

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatBoard', [
        function () {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatBoard.template.html',
                scope: {
                    chatterObj: '=',
                    chatMessages:'='
                },
                link: function (scope) {
                    scope.d = {};
                    
                }
            };
        }
    ]);
})(angular);

