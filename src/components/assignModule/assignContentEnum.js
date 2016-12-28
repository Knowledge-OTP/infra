(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').factory('AssignContentEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['LESSON', 1, 'lesson'],
                ['PRACTICE', 2, 'practice']
            ]);
        }
    );
})(angular);

