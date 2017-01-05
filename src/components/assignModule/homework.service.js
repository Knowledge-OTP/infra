(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule').service('HomeworkSrv',
        function ($q, $log, InfraConfigSrv, PopUpSrv, DueDateSrv, $translate) {
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

            function _getStudentStorage() {
                return studentStorage;
            }

            var completeAssignmentBtn = {
                resolveVal: ''
            };

            var closeBtn = {};

            function _notCompletedHomeworkHandler(homeworkObj) {
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
                var notCompletedHomework = getNotCompletedHomework(homework);
                if (notCompletedHomework) {
                    _notCompletedHomeworkHandler(notCompletedHomework);
                }
            }

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
                            return moduleResArr;
                        });
                    });
                });
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
        }
    );
})(angular);
