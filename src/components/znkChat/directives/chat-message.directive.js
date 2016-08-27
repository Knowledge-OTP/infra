

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatMessage', [
        function () {
            'ngInject';
            return {
                template: '<div class="message-wrapper">' +
                            '<div class="message">{{message.text}}</div>'+
                            '</div>',
                scope: {
                    message: '=',
                    getLocalUserId: '&localUserId'
                },
                link: function (scope, element) {
                    var element = angular.element(element[0]);
                    var classToAdd;
                    var localUserId = scope.getLocalUserId();

                    if(+localUserId === +scope.message.uid) {
                        classToAdd = 'myMessage';
                    } else {
                        classToAdd = 'otherMessage';
                    }

                    element.addClass(classToAdd);


                }
            };
        }
    ]);
})(angular);

