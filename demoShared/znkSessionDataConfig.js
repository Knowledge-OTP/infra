(function (angular) {
        'use strict';

        angular.module('demo').config(function (znkSessionDataSrvProvider) {
            function sessionSubjectsToIndexMap (SubjectEnum){
                return [
                    SubjectEnum.MATH.enum,
                    SubjectEnum.ENGLISH.enum
                ];
            }
            znkSessionDataSrvProvider.setSessionSubjects(sessionSubjectsToIndexMap);
        })
    );
})(angular);
