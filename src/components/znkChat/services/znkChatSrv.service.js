(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatSrv',
        function (InfraConfigSrv, $q) {
            'ngInject';


            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            this.getChatParticipants = function () { // e.g teacher --> connected students
                return $q.when(chatParticipantsArr);
            };

            this.getChatMessages = function (chatGuid) {
                return $q.when(messages[chatGuid]);
            };

            this.getChatGuidByTwoGuidsArray = function (chatGuidArr1, chatGuidArr2) {
                if(chatGuidArr1.length === 0 || chatGuidArr2.length === 0) {
                    return;
                }

                for(var i = 0; i < chatGuidArr1.length; i++){
                    if(chatGuidArr2.indexOf(chatGuidArr2[i]) !== 1){
                        return chatGuidArr2[i];
                    }
                }
            };


            // mock
            var chatParticipantsArr = [{name: 'name1', presence: 0, chatGuids: ['guid1']},
                {name: 'name2', presence: 1, chatGuids: ['guid2']},
                {name: 'name3', presence: 1, chatGuids: ['guid3']},
                {name: 'name4', presence: 2, chatGuids: ['guid4']}];

            var messages = {};
            messages.guid1 = [{uid: 1, text: 'aaaaaaaaaaaaaaaaaa'},
                {uid: 2, text: 'aaaaaaaaaaaaaaa'},
                {uid: 3, text: 'bbbbbbbbbbbbbbbbbb'},
                {uid: 1, text: 'ccccccccccccc'},
                {uid: 1, text: 'd'}];

            messages.guid2 = [{uid: 1, text: 'fffffffffffff'},
                {uid: 2, text: 'ffffffffffffffff'},
                {uid: 3, text: 'ggggggggggggggggg'},
                {uid: 1, text: 'hhhhhhhhhhhhhhhh'},
                {uid: 1, text: 'iiiiiiiiiiiiiiii'}];

            messages.guid3 = [{uid: 1, text: 'erwrwerwerwerwer'},
                {uid: 2, text: 'jjjjjjjjjjjjjj'},
                {uid: 3, text: 'kkkkkkkkkkkkk'}];
            messages.guid4 = [{uid: 1, text: 'dsfkoosdfsdfksodfko'},
                {uid: 2, text: 'lllkodsfsdfsokddosfkl'},
                {uid: 3, text: 'mmmmmmmmmmmmmmmmmm'}];
            // mock
        }
    );
})(angular);
