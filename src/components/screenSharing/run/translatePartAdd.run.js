(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing')
        .run(function($timeout, $translatePartialLoader){
            'ngInject';
            //must be wrapped in timeout because the parting adding cannot be made directly in a run block
            $timeout(function(){
                $translatePartialLoader.addPart('screenSharing');
            });
        });
})(angular);
