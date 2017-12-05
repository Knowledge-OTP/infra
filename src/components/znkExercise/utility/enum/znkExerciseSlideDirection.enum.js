(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseSlideDirectionEnum',
        function (EnumSrv) {
            'ngInject';
            return new EnumSrv.BaseEnum([
                ['NONE', 1, 'none'],
                ['ALL', 2, 'all'],
                ['RIGHT', 3, 'right'],
                ['LEFT', 4, 'left']
            ])
            ;
        });
})(angular);

