(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession').provider('LiveSessionSubjectSrv', function () {
        var subjects = [0, 5];

        this.setLiveSessionSubjects = function(_subjects) {
            subjects = _subjects;
        };

        this.$get = function (UtilitySrv, SessionSubjectEnumConst) {
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
