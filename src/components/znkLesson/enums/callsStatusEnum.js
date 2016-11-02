(function (angular) {
    'use strict';

    angular.module('znk.infra.znkLesson').factory('LessonsStatusEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['ENDED_LESSON', 0, 'ended lesson'],
                ['ACTIVE_LESSON', 1, 'active lesson']
            ]);
        }
    );
})(angular);

