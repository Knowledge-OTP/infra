(function (angular) {
    'use strict';
    angular.module('znk.infra.znkLesson').provider('LessonSrv',
        function() {
            var subjects;

            this.setSubjects = function(_subjects) {
                subjects = _subjects;
            };

            this.$get = function($log, ENV, AuthService, InfraConfigSrv,  StudentContextSrv, UtilitySrv, SubjectEnumConst) {
                'ngInject';
                var lessonSrvApi = {};
                var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';
                var userAuth = AuthService.getAuth();
                var globalStorageProm = InfraConfigSrv.getGlobalStorage();
                var lessonData = {
                    appName: ENV.studentAppName.split('_')[0].toUpperCase(),
                    lessonGUID: UtilitySrv.general.createGuid(),
                    educatorUID: userAuth.uid || 'N/A',
                    studentUID: StudentContextSrv.getCurrUid() || 'N/A',
                    startTime: Date.now(),
                    duration: null,
                    extendTime: minToUnixTimestamp(ENV.lessonExtendTime),
                    lessonSubject: null,
                    status: 1  //(values: 1 = Active, 0 = Ended)
                };

                function getKeyByValue(obj, value) {
                    for( var prop in obj ) {
                        if( obj.hasOwnProperty( prop ) ) {
                            if( obj[ prop ] === value )
                                return prop;
                        }
                    }
                }
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
                            path = ENV.studentAppName + '/users/$$uid/lessons/active';
                            return path.replace('$$uid', '' + lessonData.studentUID);
                        case 'educator':
                            path = ENV.dashboardAppName + '/users/' +
                                lessonData.educatorUID + '/lessons/active';
                            return path.replace('$$uid', '' + lessonData.educatorUID);
                        default:
                            return;
                    }
                }

                lessonSrvApi.saveLesson = function (subject) {
                    lessonData.lessonSubject = subject;
                    console.log('saveLesson, lessonData: ', lessonData);
                    var dataToSave = {};
                    globalStorageProm.then(function (globalStorage) {
                        globalStorage.update(getPath('lessons'), lessonData);
                        dataToSave[getPath('student')] = lessonData.lessonGUID;
                        dataToSave[getPath('educator')] = lessonData.lessonGUID;
                        console.log(getPath('educator'));
                        globalStorage.update(dataToSave);
                    });

                };

                lessonSrvApi.getSubjects = function() {
                    return subjects.map(function (subjectId) {
                        var name = getKeyByValue(SubjectEnumConst, subjectId).toLowerCase();
                        return {
                            id: subjectId,
                            name: name,
                            iconName: 'znkLesson-' + name + '-icon'
                        }
                    });
                };

                lessonSrvApi.getActiveLessonData = function () {
                    return globalStorageProm.then(function (globalStorage) {
                        return globalStorage.getAndBindToServer(purchasePath);
                    });
                };

                return lessonSrvApi;
            };
        }
    );
})(angular);

