(function (angular) {
    'use strict';

    angular.module('demo', ['znk.infra.content', 'znk.infra.config', 'znk.infra.storage'])
        .controller('demoCtrl', ['ContentSrv', function(ContentSrv) {
            ContentSrv.getContent({exerciseType: 'personalization'}).then(function(result){
                console.log('result', result);
            });
        }]);
})(angular);
