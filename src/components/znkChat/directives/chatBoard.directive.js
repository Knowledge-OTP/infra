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
                    getUserId: '&userId',
                    chatGuid: '@'
                },
                link: function (scope) {
                    scope.d = {};
                    scope.userId = scope.getUserId();

                    scope.d.sendMessage = function () {
                        if(scope.d.newMessage.length > 0){
                            var newMessageObj = {
                                time: new Date().getTime(),  // todo - get firebase timestamp
                                uid: scope.userId,
                                text: scope.d.newMessage
                            };
                            znkChatSrv.updateMessages(scope.chatGuid, newMessageObj);
                            scope.d.newMessage = '';
                        }
                    }

                }
            };
        }
    ]);
})(angular);

