(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule').service('HomeworkSrv',
        function ($q, $log, InfraConfigSrv, PopUpSrv, DueDateSrv, $translate, $rootScope, exerciseEventsConst, ExamSrv,
         ExerciseResultSrv, ExamTypeEnum, StorageSrv, ExerciseTypeEnum) {
            'ngInject';

            var self = this;
            var studentStorage = InfraConfigSrv.getStudentStorage();
            var ONE_WEEK_IN_MILLISECONDS = 604800000;
            var MINI_TEST_HOMEWORK_TYPE = 2;

            var ASSIGNMENTS_DATA_PATH = 'users/$$uid/assignmentsData';
            var ASSIGNMENT_RES_PATH = 'users/$$uid/assignmentResults';
            var MODULE_RES_PATH = 'moduleResults/';

            var completeAssignmentBtn = {
                resolveVal: ''
            };

            var closeBtn = {};

            function _getStudentStorage() {
                return studentStorage;
            }

            function _notCompletedHomeworkHandler(homeworkObj) {
                var popupTitle = 'ASSIGN_MODULE.ASSIGNMENT_AVAILABLE';
                var popupContent = 'ASSIGN_MODULE.ASSIGNMENT_PENDING';

                var latePopupTitle = 'ASSIGN_MODULE.YOUR_ASSIGNMENT_IS_LATE';
                var latePopupContent = 'ASSIGN_MODULE.PlEASE_COMPLETE_ASSIGNMENT';

                var goToAssignmentText = 'ASSIGN_MODULE.GO_TO_ASSIGNMENT';
                var closeText = 'ASSIGN_MODULE.CLOSE';

                if(isHomeworkIsLate(homeworkObj)){
                    $translate([latePopupTitle, latePopupContent, goToAssignmentText, closeText]).then(function(res){
                        var title = res[latePopupTitle];
                        var content = res[latePopupContent];
                        completeAssignmentBtn.text = res[goToAssignmentText];
                        closeBtn.text = res[closeText];
                        PopUpSrv.basePopup('error-popup homework-popup', 'popup-exclamation-mark', title, content, [closeBtn, completeAssignmentBtn]);
                    });
                } else {
                    $translate([popupTitle, popupContent, goToAssignmentText, closeText]).then(function(res){
                        var title = res[popupTitle];
                        var content = res[popupContent];
                        completeAssignmentBtn.text = res[goToAssignmentText];
                        closeBtn.text = res[closeText];
                        PopUpSrv.basePopup('warning-popup homework-popup', 'popup-exclamation-mark', title, content, [closeBtn, completeAssignmentBtn]);
                    });
                }

            }

            function _homeworkHandler(homework) {
                getNotCompletedHomework(homework).then(function(notCompletedHomework){
                    if (notCompletedHomework) {
                        _notCompletedHomeworkHandler(notCompletedHomework);
                    }
                });
            }

            function _getAllHomeworkModuleResult () {
                return _getStudentStorage().then(function(studentStorage){
                    var promArr = [];
                    var moduleResArr = [];
                    return studentStorage.get(ASSIGNMENT_RES_PATH).then(function(hwModuleResultsGuids){
                        angular.forEach(hwModuleResultsGuids,function(moduleGuid){
                            var prom = studentStorage.get(MODULE_RES_PATH + moduleGuid).then(function(moduleRes){
                                moduleResArr.push(moduleRes);
                            });
                            promArr.push(prom);
                        });

                        return $q.all(promArr).then(function(){
                            return moduleResArr;
                        });
                    });
                });
            }

            function getNotCompletedHomework() {
                return _getAllHomeworkModuleResult().then(function(allHomeworkModulesResults){
                    for(var i = 0; i < allHomeworkModulesResults.length; i++) {
                        if(!allHomeworkModulesResults[i].isComplete) {
                            return allHomeworkModulesResults[i];
                        }
                    }
                });
            }

            function _finishedSectionHandler(eventData, exerciseContent, currentExerciseResult){
                return ExamSrv.getExam(currentExerciseResult.examId).then(function (exam) {
                    var sectionsResults = [];
                    var promArr = [];
                    var dontInit = true;
                    if(exam.typeId !== ExamTypeEnum.MINI.enum){
                        return;
                    }
                    angular.forEach(exam.sections, function (section) {
                        var prom = ExerciseResultSrv.getExerciseResult(ExerciseTypeEnum.SECTION.enum, section.id, section.examId, null, dontInit).then(function(sectionResult){
                            if(currentExerciseResult.exerciseId === section.id){
                                sectionsResults.push(currentExerciseResult);
                            } else{
                                sectionsResults.push(sectionResult);
                            }
                        });
                        promArr.push(prom);
                    });

                    $q.all(promArr).then(function(){
                        for(var i = 0 ; i < sectionsResults.length; i++){
                            if(sectionsResults[i] === null || !sectionsResults[i].isComplete){
                                return;
                            }
                        }
                        _getStudentStorage().then(function (studentStorage) {
                            var homeworkObj = {
                                assignmentStartDate:  StorageSrv.variables.currTimeStamp,
                                lastAssignmentType : MINI_TEST_HOMEWORK_TYPE
                            };
                            studentStorage.set(ASSIGNMENTS_DATA_PATH, homeworkObj);
                        });
                    });
                });
            }

            function isHomeworkIsLate(homeworkObj) {
                var dueDate = homeworkObj.date + ONE_WEEK_IN_MILLISECONDS;
                var isDueDateObj = DueDateSrv.isDueDatePass(dueDate);
                if(isDueDateObj.passDue) {
                    return true;
                }
                return false;
            }

            self.homeworkPopUpReminder = function (uid) {
                var homeworkPath = 'users/$$uid/assignmentResults';
                homeworkPath = homeworkPath.replace('$$uid', uid);
                return _getStudentStorage().then(function (userStorage) {
                    userStorage.onEvent('value', homeworkPath, _homeworkHandler);
                });
            };

            self.hasLatePractice = function () {
                var notCompletedHomework = getNotCompletedHomework();
                if (angular.isDefined(notCompletedHomework)) {
                    return isHomeworkIsLate(notCompletedHomework);
                } else {
                    return false;
                }
            };

            self.assignHomework = function(){
                return _getStudentStorage().then(function (studentStorage) {
                    return studentStorage.get(ASSIGNMENTS_DATA_PATH).then(function(assignment){
                        if(angular.equals({}, assignment) || angular.isUndefined(assignment) || assignment === null){
                            $rootScope.$on(exerciseEventsConst.section.FINISH, _finishedSectionHandler);
                        }
                    });
                });
            };
        }
    );
})(angular);
