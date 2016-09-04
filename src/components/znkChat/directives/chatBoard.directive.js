(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatBoard',
        function (znkChatSrv, $timeout, $filter, $translate) {
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
                    scope.d = {};

                    scope.d.scrollToLastMessage = function () {
                        $timeout(function () {                // message need rendered first
                            chatBoardScrollElement.scrollTop = chatBoardScrollElement.scrollHeight;
                        });
                    };

                    scope.userId = scope.getUserId();

                    scope.d.closeChat = scope.closeChat();

                    scope.d.dateMap = {};
                    scope.d.showDate = function (timeStamp) {
                        var date = $filter('date')(timeStamp, 'EEE, MMM d', 'UTC'); // all time messages saved in UTC time zone.
                        if (angular.isUndefined(scope.d.dateMap[date])) {  // show message date only once per day.
                            scope.d.dateMap[date] = date;
                            return date;
                        }
                    };

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

                    function _getUtcTime() { // todo - move to service
                        var now = new Date();
                        var utc_now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
                        return utc_now.getTime();
                    }
                }
            };
        }
    );
})(angular);

