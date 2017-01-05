(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule').service('HomeworkSrv',
        function ($q, $log, InfraConfigSrv, PopUpSrv, $state, ExamSrv, DueDateSrv, $translate) {
            'ngInject';
            var self = this;
            var studentStorage = InfraConfigSrv.getStudentStorage();
            var ONE_WEEK_IN_MILLISECONDS = 604800000;

            var popupTitle = 'ASSIGN_MODULE.ASSIGNMENT_AVAILABLE';
            var popupContent = 'ASSIGN_MODULE.ASSIGNMENT_PENDING';

            var latePopupTitle = 'ASSIGN_MODULE.YOUR_ASSIGNMENT_IS_LATE';
            var latePopupContent = 'ASSIGN_MODULE.PlEASE_COMPLETE_ASSIGNMENT';

            var goToAssignmentText = 'ASSIGN_MODULE.GO_TO_ASSIGNMENT';
            var closeText = 'ASSIGN_MODULE.CLOSE';

            var homeworkPath = 'users/$$uid/assignmentResults';

            function _navigateToHomework() {
                $state.go('app.eTutoring');
            }

            function _getStudentStorage() {
                return studentStorage;
            }

            var completeAssignmentBtn = {
                resolveVal: _navigateToHomework
            };

            var closeBtn = {};

            function _notCompletedHomeworkHandler(homeworkObj) {
                ExamSrv.getExam(homeworkObj.examId).then(function (examObj) {
                    if (!examObj.isCompleted) {
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
                    } else {
                        _updateAssignmentResult(homeworkObj.guid);
                    }
                });
            }

            function _homeworkHandler(homework) {
                var notCompletedHomework = getNotCompletedHomework(homework);
                if (notCompletedHomework) {
                    _notCompletedHomeworkHandler(notCompletedHomework);
                }
            }

            function getNotCompletedHomework() {
                _getAllHomeworkModuleResult().then(function(allHomeworkModulesResults){
                    for(var i = 0; i < allHomeworkModulesResults.length; i++) {
                        if(!allHomeworkModulesResults[i].isComplete) {
                            return allHomeworkModulesResults[i];
                        }
                    }
                });
            }

            function _updateAssignmentResult(guid) {
                var path = 'users/$$uid/assignmentResults/' + guid + '/isComplete';
                return _getStudentStorage().then(function (userStorage) {
                    userStorage.update(path, true);
                });
            }

            self.homeworkPopUpReminder = function (uid) {
                homeworkPath = homeworkPath.replace('$$uid', uid);
                return _getStudentStorage().then(function (userStorage) {
                    userStorage.onEvent('value', homeworkPath, _homeworkHandler);
                });
            };

            function isHomeworkIsLate(homeworkObj) {
                var dueDate = homeworkObj.date + ONE_WEEK_IN_MILLISECONDS;
                var isDueDateObj = DueDateSrv.isDueDatePass(dueDate);
                if(isDueDateObj.passDue) {
                    return true;
                }
                return false;
            }

            self.hasLatePractice = function () {
                var notCompletedHomework = getNotCompletedHomework();
                if (angular.isDefined(notCompletedHomework)) {
                    return isHomeworkIsLate(notCompletedHomework);
                } else {
                    return false;
                }
            };

            function _getAllHomeworkModuleResult () {
                var assignmentsResPath = 'users/$$uid/assignmentResults';
                var moduleResPath = 'moduleResults/';

                return _getStudentStorage().then(function(studentStorage){
                    var promArr = [];
                    var moduleResArr = [];
                    return studentStorage.get(assignmentsResPath).then(function(hwModuleResultsGuids){
                        angular.forEach(hwModuleResultsGuids,function(moduleGuid){
                            var prom = studentStorage.get(moduleResPath + moduleGuid).then(function(moduleRes){
                                moduleResArr.push(moduleRes);
                            });
                            promArr.push(prom);
                        });

                        return $q.all(promArr).then(function(){
                            return moduleResArr
                        });
                    });
                });
            };

            function _updateModuleResultAsComplete(homeworkModuleResultGuid){
                var path = 'moduleResults/' + homeworkModuleResultGuid + '/isComplete';
                return _getStudentStorage().then(function(studentStorage){
                    studentStorage.update(path, true);
                });
            }

            function _updateHomeworkStatus(homeworkModuleResult, currentExerciseResult, getExerciseResult){
                var promoArr = [];
                var exercisesReultsArr = [];
                var dontInit = true;
                angular.forEach(homeworkModuleResult.exercises, function(exercise){
                    var prom = getExerciseResult(exercise.exerciseTypeId, exercise.exerciseId, exercise.examId, null, dontInit).then(function(exerciseRes){
                        if(exerciseRes && exerciseRes.guid === currentExerciseResult.guid){
                            exercisesReultsArr.push(currentExerciseResult);
                        } else {
                            if(exerciseRes){
                                exercisesReultsArr.push(exerciseRes);
                            }
                        }

                    });
                    promoArr.push(prom);
                });

                $q.all(promoArr).then(function(){
                    _updateModuleResultAsComplete(homeworkModuleResult.guid)

                    if(homeworkModuleResult.exercises.length !== exercisesReultsArr.length) {
                        return;
                    }
                    for (var i = 0; i < exercisesReultsArr.length; i++) {
                        if (!exercisesReultsArr[i].isComplete) {
                            return;
                        }
                    }
                    _updateModuleResultAsComplete(homeworkModuleResult.guid)
                })
            }

            self.updateAllHomeworkStatus = function(currentExerciseResult, getExerciseResult){
                _getAllHomeworkModuleResult().then(function(allHomeworkModulesResults){
                    for(var i = 0 ; i < allHomeworkModulesResults.length; i++){
                        if(!allHomeworkModulesResults[i].isComplete){
                            _updateHomeworkStatus(allHomeworkModulesResults[i],currentExerciseResult, getExerciseResult);
                        }
                    }
                });
            };

        }
    );
})(angular);
