(function (angular) {
    'use strict';

    angular.module('znk.infra.support').service('SupportSrv',
        ["InfraConfigSrv", "ENV", "AuthService", "UserProfileService", "$q", "$injector", "$log", "teachersSrv", "$http", function (InfraConfigSrv, ENV, AuthService, UserProfileService, $q, $injector, $log, teachersSrv, $http) {
            'ngInject';
            var SupportSrv = {};

            var authData = AuthService.getAuth();
            var APPROVED_STUDENTS_PATH = 'users/$$uid/approvedStudents/';
            var invitationEndpoint = ENV.backendEndpoint + 'invitation';
            var SUPPORT_EMAIL = ENV.supportEmail;
            var NO_EMAIL = 'noEmail@zinkerz.com'; // in case the user has no email.

            SupportSrv.connectTeacherWithSupport = function (callbackFn) {
                $injector.invoke(['GroupsService', function(GroupsService){
                    if (authData && authData.uid) {
                        return InfraConfigSrv.getTeacherStorage().then(function (teacherStorage) {
                            return teacherStorage.get(APPROVED_STUDENTS_PATH).then(function (students) {
                                var studentKeys = Object.keys(students);

                                var linkedToSupport = false;

                                var promsArray = [];
                                angular.forEach(studentKeys, function (studentId) {
                                    var prom = GroupsService.getUserData(studentId).then(function (studentData) {
                                        if (studentData.originalReceiverEmail === SUPPORT_EMAIL) {
                                            linkedToSupport = true;
                                        }
                                    });
                                    promsArray.push(prom);
                                });
                                $q.all(promsArray).then(function () {
                                    if (!linkedToSupport && authData.auth.email !== SUPPORT_EMAIL) {
                                        _buildDataToSend(callbackFn);
                                    } else {
                                        callbackFn();
                                    }
                                });
                            });
                        });
                    }
                }]);
            };

            SupportSrv.connectStudentWithSupport = function (callbackFn) {
                if (authData && authData.uid) {
                    teachersSrv.getAllTeachers().then(function (teachers) {
                        var teachersKeys = Object.keys(teachers);
                        var linkedToSupport = false;

                        angular.forEach(teachersKeys, function (key) {
                            teachers[key].isTeacher = true;
                            if (teachers[key].email === SUPPORT_EMAIL) {
                                linkedToSupport = true;
                            }
                        });

                        if (!linkedToSupport && authData.auth.email !== SUPPORT_EMAIL) {
                            _buildDataToSend(callbackFn);
                        } else {
                            callbackFn();
                        }
                    });
                }
            };

            function _buildDataToSend(callbackFn){
                UserProfileService.getProfileByUserId(authData.uid).then(function (userProfile) {
                    var receiverName = userProfile.nickname;
                    var receiverEmail = authData.auth.email || userProfile.email || NO_EMAIL;
                    if (angular.isUndefined(receiverName) || angular.equals(receiverName, '')) {
                        receiverName = receiverEmail;
                    }

                    var dataToSend = {
                        receiverAppName: ENV.firebaseAppScopeName,
                        receiverEmail: receiverEmail,
                        receiverName: receiverName,
                        receiverUid: authData.uid,
                        receiverParentEmail: '',
                        receiverParentName: ''
                    };

                    _connectSupportToUser(dataToSend).then(function (response) {
                        callbackFn(response);
                    });
                });
            }

            function _connectSupportToUser(dataToSend) {
                var config = {
                    timeout: ENV.promiseTimeOut || 15000
                };
                return $http.post(invitationEndpoint + '/support', dataToSend, config).then(
                    function (response) {
                        return {
                            data: response.data
                        };
                    },
                    function (error) {
                        $log.debug(error);
                });
            }

        return SupportSrv;
        }]
    );
})(angular);




(function (angular) {
    'use strict';

    angular.module('znk.infra.support', []);
})(angular);

angular.module('znk.infra.support').run(['$templateCache', function($templateCache) {

}]);
