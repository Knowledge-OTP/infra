(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .run(function($timeout, $translatePartialLoader){
            'ngInject';
            //must be wrapped in timeout because the parting adding cannot be made directly in a run block
            $timeout(function(){
                $translatePartialLoader.addPart('calls');
            });
        });
})(angular);
