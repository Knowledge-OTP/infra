(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatBoard', ['znkChatSrv',
        function (znkChatSrv) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatBoard.template.html',
                scope: {
                    chatterObj: '=',
                    chatMessages: '=',
                    getUserId: '&userId'
                },
                link: function (scope) {
                    scope.d = {};
                    scope.userId = scope.getUserId();

                    scope.d.sendMessage = function () {
                        if(scope.d.newMessage.length > 0){
                            var newMessageObj = {
                                time: new Date().getTime(),
                                uid: scope.userId,
                                text: scope.d.newMessage
                            };
                            scope.chatMessages.push(newMessageObj);
                            znkChatSrv.updateMessages(scope.chatMessages);
                            scope.d.newMessage = '';
                        }
                    }

                }
            };
        }
    ]);
})(angular);

