(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession').provider('LiveSessionSubjectSrv', function () {
        var subjects;

        this.setLiveSessionSubjects = function(_subjects) {
            subjects = _subjects;
        };

        this.$get = function (SessionSubjectEnumConst, UtilitySrv) {
            'ngInject';

            var LiveSessionSubjectSrv = {};

            function _getLiveSessionSubjects() {
                if (!subjects) {
                    subjects = [SessionSubjectEnumConst.MATH, SessionSubjectEnumConst.ENGLISH];
                }
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
