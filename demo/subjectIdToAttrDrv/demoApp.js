(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.general'])
        .config(function(){

        })
        .controller('main',function($scope){
            $scope.prefix = 'cp, np';
        });
})(angular);
