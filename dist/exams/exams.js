(function (angular) {
    'use strict';

    angular.module('znk.infra.exams', []);
})(angular);

"use strict";
angular.module('znk.infra.exams').service('ExamSrv', function(StorageRevSrv, $q, ContentAvailSrv, $log) {
        'ngInject';

        var self = this;

        function _getExamOrder() {
            return StorageRevSrv.getContent({
                exerciseType: 'personalization'
            }).then(function (personalizationData) {
                var errorMsg = 'ExamSrv getExamOrder: personalization.examOrder is not array or empty!';
                if (!angular.isArray(personalizationData.examOrder) || personalizationData.examOrder.length === 0) {
                    $log.error(errorMsg);
                    return $q.reject(errorMsg);
                }
                return personalizationData.examOrder;
            });
        }

        function _getContentFromStorage(data) {
            return StorageRevSrv.getContent(data);
        }

        this.getExam = function (examId, setIsAvail) {
            return _getContentFromStorage({
                exerciseId: examId, exerciseType: 'exam'
            }).then(function (exam) {
                if (!setIsAvail) {
                    return exam;
                }

                var getIsAvailPromArr = [];
                var sections = exam.sections;
                angular.forEach(sections, function (section) {
                    var isSectionAvailProm = ContentAvailSrv.isSectionAvail(examId, section.id).then(function (isAvail) {
                        section.isAvail = !!isAvail;
                    });
                    getIsAvailPromArr.push(isSectionAvailProm);
                });

                return $q.all(getIsAvailPromArr).then(function () {
                    return exam;
                });
            });
        };

        this.getExamSection = function (sectionId) {
            return _getContentFromStorage({
                exerciseId: sectionId, exerciseType: 'section'
            });
        };

        this.getAllExams = function (setIsAvail) {
            return _getExamOrder().then(function (examOrder) {
                var examsProms = [];
                var examsByOrder = examOrder.sort(function (a, b) {
                    return a.order > b.order;
                });
                angular.forEach(examsByOrder, function (exam) {
                    examsProms.push(self.getExam(exam.examId, setIsAvail));
                });
                return $q.all(examsProms);
            });
        };
});

angular.module('znk.infra.exams').run(['$templateCache', function($templateCache) {

}]);
