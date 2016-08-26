(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat', ['$translatePartialLoader', 'znkChatSrv',
        function ($translatePartialLoader, znkChatSrv) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {
                    userChatObj:'='
                },
                link: function (scope) {
                    $translatePartialLoader.addPart('znkChat');

                    var statesView = {
                        CHAT_BUTTON_VIEW: 1,
                        CHAT_VIEW: 2

                    };
                    scope.d = {};
                    scope.d.chatStateView = statesView.CHAT_VIEW;
                    scope.d.openChat = function () {
                        scope.chatStateView = statesView.CHAT_VIEW;
                    };

                    scope.d.selectChatter = function (chatter) {
                        var chatGuid1 = scope.userChatObj.chatGuids;
                        var chatGuid2 = chatter.chatGuids;
                        var chatGuid = znkChatSrv.getChatGuidByTwoGuidsArray(chatGuid1,chatGuid2);
                        znkChatSrv.getChatMessages(chatGuid).then(function (chatMessages) {
                            scope.d.selectedChatter = chatter;
                            scope.d.chatMessages = chatMessages;
                        })
                    }
                    
                }
            };
        }
    ]);
})(angular);

