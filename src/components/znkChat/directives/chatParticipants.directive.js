(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants',
        function (znkChatSrv, UtilitySrv) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatParticipants.template.html',
                scope: {
                    selectChatter: '&'
                },
                link: function (scope) {
                    scope.d = {};
                    znkChatSrv.getChatParticipants().then(function (chatParticipantsArr) {
                        scope.d.chatParticipantsArr = UtilitySrv.object.convertToArray(chatParticipantsArr);
                         _tempFn(scope.d.chatParticipantsArr);  // todo -until will get correct array
                        scope.selectChatter()(scope.d.chatParticipantsArr[0]);

                        function _tempFn(teacherArr) {
                            for(var i = 0 ; i < teacherArr.length; i++){
                                teacherArr[i].name = teacherArr[i].senderName;
                            }
                        }
                    });
                }
            };
        }
    );
})(angular);

