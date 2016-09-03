(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatMessage', [
        function () {
            'ngInject';
            return {
                template: '<div class="message-wrapper">' +
                '<div class="message-date" ng-if="d.date">{{d.date}}</div>'+
                '<div class="message">' +
                '{{message.text}}' +
                ' <div class="bottom-triangle"></div>' +
                '</div>' +
                '</div>',
                scope: {
                    message: '=',
                    getLocalUserId: '&localUserId',
                    lastMessage: '&',
                    scrollToLastMessage: '&',
                    dateGetter:'&showDate'
                },
                link: function (scope, element) {
                    var classToAdd;
                    var localUserId = scope.getLocalUserId();
                    scope.d = {};
                    scope.d.date = scope.dateGetter()(scope.message.time);

                    if (String(localUserId) === String(scope.message.uid)) {
                        classToAdd = 'myMessage';
                    } else {
                        classToAdd = 'otherMessage';
                    }
                    element.addClass(classToAdd);
                    scope.scrollToLastMessage()();
                }
            };
        }
    ]);
})(angular);

