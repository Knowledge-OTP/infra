(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants',
        function () {
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
                    var ACTIVE_SUPPORT = -1;
                    var FIRST_CHATTERS_ARRAY_INDEX = 0;

                    if(scope.d.chatData.support && scope.d.chatData.support.uid){
                        scope.d.selctedChatter = ACTIVE_SUPPORT;
                    } else {
                        scope.d.selctedChatter = FIRST_CHATTERS_ARRAY_INDEX;
                    }

                }
            };
        }
    );
})(angular);

