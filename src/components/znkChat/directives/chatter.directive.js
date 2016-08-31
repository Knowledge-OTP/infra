(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatter',
        function (znkChatSrv, $q, znkChatEventSrv, $timeout) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatter.template.html',
                scope: {
                    chatterObj: '=',
                    localUserChatsGuidsArr: '=',
                    localUserId: '&',
                    setFirstChatter: '&?'
                },
                link: function (scope) {
                    scope.d = {};
                    var chatGuidProm;
                    var callbacksToRemove;
                    var localUseId = scope.localUserId();

                    if (scope.localUserChatsGuidsArr) {
                        znkChatSrv.getChatGuidsByUid(scope.chatterObj.uid).then(function (chatterChatGuidsArr) {
                            if (angular.isArray(chatterChatGuidsArr) && angular.isArray(scope.localUserChatsGuidsArr) && chatterChatGuidsArr.length > 0 && chatterChatGuidsArr.length > 0) {
                                chatGuidProm = znkChatSrv.getChatGuidByTwoGuidsArray(scope.localUserChatsGuidsArr, chatterChatGuidsArr);
                            } else {
                                chatGuidProm = znkChatSrv.createNewChat(localUseId, scope.chatterObj.uid);
                            }
                            $q.when(chatGuidProm).then(function (chatGuid) {
                                scope.chatterObj.chatMessages = [];
                                scope.chatterObj.chatGuid = chatGuid;
                                scope.setFirstChatter(scope.chatterObj);
                                _startListen(chatGuid);
                            })
                        })
                    }

                    function _startListen(chatGuid) {
                        var path = 'users/simplelogin:12333/chats/' + chatGuid + '/messages'; // todo - make function that return this path
                        znkChatEventSrv.registerEvent('child_added', path, callback);
                    }

                    function callback(snapShot) {
                        var newData = snapShot.val();
                        $timeout(function(){
                            scope.chatterObj.chatMessages.push(newData);
                        });
                    }
                    callbacksToRemove = callback;
                    return callback;
                }
            };
        }
    );
})(angular);

