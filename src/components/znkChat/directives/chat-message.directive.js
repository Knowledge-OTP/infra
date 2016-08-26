

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatMessage', [
        function () {
            'ngInject';
            return {
                template: '<div class="message-wrapper">' +
                            '<div>{{message.text}}</div>'+
                            '</div>',
                scope: {
                    message: '='
                },
                link: function (scope) {
                    scope.d = {};

                }
            };
        }
    ]);
})(angular);

