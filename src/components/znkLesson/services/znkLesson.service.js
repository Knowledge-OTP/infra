(function (angular) {
    'use strict';
    angular.module('znk.infra.znkLesson').service('LessonSrv',

        function($log, ENV, AuthService, InfraConfigSrv,  StudentContextSrv, UtilitySrv) {
            'ngInject';

            var vm = this;
            var userAuth = AuthService.getAuth();
            var globalStorageProm = InfraConfigSrv.getGlobalStorage();
            var lessonData = {
                appName: ENV.studentAppName.split('_')[0].toUpperCase(),
                lessonGUID: UtilitySrv.general.createGuid(),
                educatorUID: userAuth.uid,
                studentUID: StudentContextSrv.getCurrUid() || null,
                startTime: Date.now(),
                duration: null,
                extendTime: minToUnixTimestamp(ENV.lessonExtendTime),
                lessonSubject: null,
                status: 1  //(values: 1 = Active, 0 = Ended)
            };


            function minToUnixTimestamp(min) {
                return min * 60 * 1000;
            }
            function getPath(param) {
                if (!userAuth) {
                    $log.error('Invalid user');
                    return;
                }
                var path;
                switch (param) {
                    case 'lessons':
                        path = ENV.studentAppName + '/lessons/' + lessonData.lessonGUID;
                        return path;
                    case 'student':
                        path = ENV.studentAppName + '/users/$$uid/lessons/' + lessonData.lessonGUID;
                        return path.replace('$$uid', '' + userAuth.uid);
                    case 'educator':
                        path = ENV.dashboardAppName + '/users/' +
                               lessonData.educatorUID + '/Lessons/'+ lessonData.lessonGUID;
                        return path.replace('$$uid', '' + userAuth.uid);
                    default:
                        return;
                }
            }

            vm.saveLesson = function () {
                console.log('saveLesson, lessonData: ', lessonData);
                console.log('getPath: ', getPath('lessons'));

            }
        }
    );
})(angular);

