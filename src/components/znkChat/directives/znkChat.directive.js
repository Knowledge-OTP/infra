(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat',
        function ($translatePartialLoader, znkChatSrv, $q, UtilitySrv, znkChatEventSrv) {
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
                        var localUid = scope.userChatObj.uid;
                        var chatterUid = chatter.uid;

                        var localUserChatsGuidsProm = znkChatSrv.getChatGuidsByUid(localUid);
                        var chatterChatsGuidProm =  znkChatSrv.getChatGuidsByUid(chatterUid);
                        var chatGuidProm;

                        $q.all([localUserChatsGuidsProm,chatterChatsGuidProm]).then(function(results){
                            var localUserChatGuidsArr = results[0];
                            var chatterChatGuidsArr = results[1];
                            if (angular.isArray(localUserChatGuidsArr) && angular.isArray(chatterChatGuidsArr) && localUserChatGuidsArr.length > 0 && chatterChatGuidsArr.length > 0) {
                                chatGuidProm = znkChatSrv.getChatGuidByTwoGuidsArray(localUserChatGuidsArr, chatterChatGuidsArr);
                            } else {
                                chatGuidProm = znkChatSrv.createNewChat(localUid, chatterUid);
                            }
                            $q.when(chatGuidProm).then(function(chatGuid){
                                znkChatSrv.getChatMessages(chatGuid).then(function (chatMessages) {
                                    scope.d.chatMessages = UtilitySrv.object.convertToArray(chatMessages);
                                    scope.d.chatGuid = chatGuid;
                                    scope.d.selectedChatter = chatter;
                                });
                            })
                        })
                    };
                    var path = 'users/simplelogin:12333/chats/-KQLavqgdLSbTuF5ApBI/'; // todo - make for all chats
                    znkChatEventSrv.registerEvent('value',path , callback);

                    function callback(newData){
                        scope.d.chatMessages = newData.messages;
                    }
                }
            };
        }
    );
})(angular);

