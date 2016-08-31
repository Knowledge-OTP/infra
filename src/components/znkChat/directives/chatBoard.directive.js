(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatBoard', ['znkChatSrv',
        function (znkChatSrv) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatBoard.template.html',
                scope: {
                    chatterObj: '=',
                    getUserId: '&userId'
                },
                link: function (scope) {
                    scope.d = {};
                    scope.userId = scope.getUserId();

                    scope.d.sendMessage = function () {
                        if(scope.d.newMessage.length > 0){
                            var newMessageObj = {
                                time: Firebase.ServerValue.TIMESTAMP,  // todo - figure how change to general adapter
                                uid: scope.userId,
                                text: scope.d.newMessage
                            };
                            znkChatSrv.updateChat(scope.chatterObj.chatGuid, newMessageObj, scope.userId);
                            scope.d.newMessage = '';
                        }
                    };
                }
            };
        }
    ]);
})(angular);

