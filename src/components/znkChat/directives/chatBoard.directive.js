(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatBoard',
        function (znkChatSrv, $timeout, $filter) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatBoard.template.html',
                scope: {
                    chatterObj: '=',
                    getUserId: '&userId',
                    closeChat: '&'
                },
                link: function (scope, element) {
                    var chatBoardScrollElement = element[0].querySelector('.messages-wrapper');
                    var dateMap = {};

                    scope.d = {};

                    scope.d.scrollToLastMessage = function () {
                        $timeout(function () {                // message need rendered first
                            chatBoardScrollElement.scrollTop = chatBoardScrollElement.scrollHeight;
                        });
                    };

                    scope.userId = scope.getUserId();

                    scope.d.closeChat = scope.closeChat();

                    scope.$watch('chatterObj', function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            dateMap = {};
                        }
                    });

                    scope.d.showDate = function (timeStamp) {
                        return $timeout(function () {         // wait for chatterObj watch checked first
                            var date = $filter('date')(timeStamp, 'EEE, MMM d');
                            if (angular.isUndefined(dateMap[date])) {  // show message date only once per day.
                                dateMap[date] = date;
                                return date;
                            }
                        });
                    };

                    scope.d.sendMessage = function () {
                        if (scope.d.newMessage.length > 0) {
                            var newMessageObj = {
                                time: Firebase.ServerValue.TIMESTAMP,
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
    );
})(angular);
