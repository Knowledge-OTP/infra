(function (angular) {
    'use strict';

    angular.module('demo', [
        'znk.infra.config',
        'znk.infra.storage',
        'znk.infra.teachers'
    ])
        .controller('ctrl', function ($scope, teachersSrv) {
            teachersSrv.getAllTeachers().then(function(teachers){
                $scope.teachers = teachers;
            });

        });

})(angular);
