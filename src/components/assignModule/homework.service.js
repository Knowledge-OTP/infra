(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule').service('HomeworkSrv',
        function ($q, $log, InfraConfigSrv, PopUpSrv, $state, ExamSrv) {
            'ngInject';

            var self = this;
            var studentStorage = InfraConfigSrv.getStudentStorage();
            // todo - translate!!!
            var popupTitle = 'An assignment is available';
            var popContent = 'You have an assignment pending. Click below to complete your assignment.';
            var goToAssignmentText = 'GO TO ASSIGNMENT';
            var closeText = 'CLOSE';
            var homeworkPath = 'users/$$uid/assignments/assignmentResults';

            function _navigateToHomework() {
                $state.go('app.eTutoring');
            }

            function _getStudentStorage() {
                return studentStorage;
            }

            var completeAssignmentBtn = {
                text: goToAssignmentText,
                resolveVal: _navigateToHomework
            };

            var closeBtn = {
                text: closeText
            };

            function _notCompletedHomeworkHandler(homeworkObj) {
                ExamSrv.getExam(homeworkObj.examId).then(function (examObj) {
                    if (!examObj.isCompleted) {
                        PopUpSrv.basePopup('warning-popup homework-popup', 'popup-exclamation-mark', popupTitle, popContent, [closeBtn, completeAssignmentBtn]);
                    } else {
                        _updateAssignmentResult(homeworkObj.guid);
                    }
                });
            }

            function _homeworkHandler(homework) {
                var keys = Object.keys(homework);
                for (var i = 0; i < keys.length; i++) {
                    if (!homework[keys[i]].isComplete) {
                        _notCompletedHomeworkHandler(homework[keys[i]]);
                        return;
                    }
                }
            }

            function _updateAssignmentResult(guid) {
                var path = 'users/$$uid/assignments/assignmentResult/' + guid + '/isComplete';
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
        }
    );
})(angular);
