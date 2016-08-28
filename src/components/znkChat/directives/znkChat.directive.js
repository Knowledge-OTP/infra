(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat', ['$translatePartialLoader', 'znkChatSrv', '$q',
        function ($translatePartialLoader, znkChatSrv, $q) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {
                    userChatObj: '='
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
                        debugger;
                        var chatGuid1 = scope.userChatObj.chatGuids;
                        var chatGuid2 = chatter.chatGuids;
                        var chatGuidProm;
                        if (angular.isDefined(chatGuid1) && angular.isDefined(chatGuid2)) {
                            chatGuidProm = znkChatSrv.getChatGuidByTwoGuidsArray(chatGuid1, chatGuid2);
                        } else {
                            var localUid = scope.userChatObj.uid;
                            var chatterUid = chatter.senderUid;
                            chatGuidProm = znkChatSrv.createNewChat(localUid, chatterUid);
                        }
                        $q.when(chatGuidProm).then(function(chatGuid){
                            znkChatSrv.getChatMessages(chatGuid).then(function (chatMessages) {
                                scope.d.selectedChatter = chatter;
                                scope.d.chatMessages = chatMessages;
                            });
                        })

                    }

                }
            };
        }
    ]);
})(angular);

