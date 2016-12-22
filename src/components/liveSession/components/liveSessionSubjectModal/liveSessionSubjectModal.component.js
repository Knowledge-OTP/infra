(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession')
        .component('liveSessionSubjectModal', {
            bindings: {
                student: '='
            },
            templateUrl: 'components/liveSession/components/liveSessionSubjectModal/liveSessionSubjectModal.template.html',
            controllerAs: 'vm',
            controller: function($mdDialog, LiveSessionSubjectSrv, LiveSessionSrv) {
                'ngInject';

                var vm = this;

                vm.sessionSubjects = LiveSessionSubjectSrv.getLiveSessionSubjects();
                vm.closeModal = $mdDialog.cancel;
                vm.startSession = function (sessionSubject) {
                    var currStudent = vm.student;
                    if (!currStudent) {
                        return;
                    }

                    var studentData = {
                        isTeacher: false,
                        uid: currStudent.uid
                    };
                    LiveSessionSrv.startLiveSession(studentData, sessionSubject);
                };
            }
        });
})(angular);
