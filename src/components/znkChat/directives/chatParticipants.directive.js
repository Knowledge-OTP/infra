(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants',
        function (znkChatDataSrv, znkChatEventSrv, ZNK_CHAT) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatParticipants.template.html',
                scope: {
                    selectChatter: '&',
                    chatData: '='
                },
                link: function (scope) {
                    scope.d = {};
                    scope.d.chatData = scope.chatData;
                    scope.d.selectChatter = scope.selectChatter();
                    scope.d.chatData.chatParticipantsArr = [];
                    var chatPaths = znkChatDataSrv.getChatPaths();
                    var localUserUid = scope.d.chatData.localUser.uid;
                    var chattersPath = chatPaths.newChatParticipantsListener;
                    chattersPath = chattersPath.replace('$$uid', localUserUid);

                    var newChatterHandler = function (newChatter) {
                        if (newChatter.email === ZNK_CHAT.SUPPORT_EMAIL) {
                            scope.d.chatData.support = newChatter;
                        } else {
                            scope.d.chatData.chatParticipantsArr.push(newChatter);
                        }
                    };
                    znkChatEventSrv.getChattersListener(chattersPath, newChatterHandler);

                    scope.$on('$destroy', function () {
                        znkChatEventSrv.offNewChatterEvent(chattersPath);
                    });
                }
            };
        }
    );
})(angular);

