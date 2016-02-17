(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.general'])
        .controller('subjectIdToAttrDrvDemoCtrl',function($scope){
            $scope.prefix = 'prefix1,prefix2';

            $scope.currentSubject = 1;
        });
})(angular);
