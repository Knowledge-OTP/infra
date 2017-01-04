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

            var homeworkPath = 'users/$$uid/assignments/assignmentResults';

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

            function getNotCompletedHomework(homework) {
                if(angular.isUndefined(homework) || homework === null){
                    return;
                }
                var keys = Object.keys(homework);
                for (var i = 0; i < keys.length; i++) {
                    if (!homework[keys[i]].isComplete) {
                        return homework[keys[i]];
                    }
                }
            }

            function _updateAssignmentResult(guid) {
                var path = 'users/$$uid/assignments/assignmentResults/' + guid + '/isComplete';
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
                var path = 'users/$$uid/assignments/assignmentResults';
                return _getStudentStorage().then(function (userStorage) {
                    return userStorage.get(path).then(function (homework) {
                        var notCompletedHomework = getNotCompletedHomework(homework);
                        if (angular.isDefined(notCompletedHomework)) {
                            return isHomeworkIsLate(notCompletedHomework);
                        } else {
                            return false;
                        }
                    });
                });
            };

            self.getAllHomeworkModuleResult = function(){
                var assignmentsResPath = 'users/$$uid/assignmentResults';
                var moduleResPath = 'moduleResults/';
                return _getStudentStorage().then(function(studentStorage){
                    var promArr = [];
                    var moduleResArr = [];
                    studentStorage.get(assignmentsResPath).then(function(hwModuleResultsGuids){
                        angular.forEach(hwModuleResultsGuids,function(moduleGuid){
                            var prom = studentStorage.get(moduleResPath + moduleGuid).then(function(moduleRes){
                                moduleResArr.push(moduleRes);
                            });
                            promArr.push(prom);
                        })
                    });

                    return $q.all(promArr).then(function(){
                        return promArr;
                    })
                })
            }
        }
    );
})(angular);
