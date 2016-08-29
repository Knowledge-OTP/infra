(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatEventSrv',
        function ($q, InfraConfigSrv) {
            'ngInject';

            var self = this;

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            self.registerEvent = function(type, path, callback){
                return _getStorage().then(function (globalStorage) {
                    globalStorage.onEvent(type, path, callback);
                });
            }
        }
    );
})(angular);
