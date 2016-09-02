(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatBoard',
        function (znkChatSrv, $timeout) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatBoard.template.html',
                scope: {
                    chatterObj: '=',
                    getUserId: '&userId',
                    closeChat: '&'
                },
                link: function (scope, element) {
                    var chatboardScrollElement = element[0].querySelector('.messages-wrapper');
                    scope.d = {};

                    scope.d.scrollToLastMessage = function () { // message need rendered first
                        $timeout(function () {
                            chatboardScrollElement.scrollTop = chatboardScrollElement.scrollHeight;
                        });
                    };

                    scope.userId = scope.getUserId();
                    scope.d.closeChat = scope.closeChat();
                    scope.d.sendMessage = function () {
                        if (scope.d.newMessage.length > 0) {
                            var newMessageObj = {
                                time: _getUtcTime(),
                                uid: scope.userId,
                                text: scope.d.newMessage
                            };
                            znkChatSrv.updateChat(scope.chatterObj.chatGuid, newMessageObj, scope.userId);
                            scope.d.newMessage = '';
                        }
                    };

                    function _getUtcTime(){
                        var now = new Date();
                        var utc_now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
                        return utc_now.getTime();
                    }
                }
            };
        }
    );
})(angular);

