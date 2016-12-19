(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession').provider('LiveSessionSubjectSrv', function (SessionSubjectEnumConst) {
        var subjects = [SessionSubjectEnumConst.MATH, SessionSubjectEnumConst.ENGLISH];

        this.setLiveSessionSubjects = function(_subjects) {
            subjects = _subjects;
        };

        this.$get = function (UtilitySrv) {
            'ngInject';

            var LiveSessionSubjectSrv = {};

            function _getLiveSessionSubjects() {
                return subjects.map(function (subjectEnum) {
                    var subjectName = UtilitySrv.object.getKeyByValue(SessionSubjectEnumConst, subjectEnum).toLowerCase();
                    return {
                        id: subjectEnum,
                        name: subjectName,
                        iconName: 'liveSession-' + subjectName + '-icon'
                    };
                });
            }

            LiveSessionSubjectSrv.getLiveSessionSubjects = _getLiveSessionSubjects;

            return LiveSessionSubjectSrv;
        };
    });
})(angular);
