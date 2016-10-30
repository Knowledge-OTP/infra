(function (angular) {
    'use strict';


    angular.module('znk.infra.support').service('SupportSrv',
        function (InfraConfigSrv,GroupsService, InvitationService, ENV, AuthService) {
            'ngInject';
            var SupportSrv = {};

            var authData = AuthService.getAuth();
            var APPROVED_STUDENTS_PATH = 'users/$$uid/approvedStudents/';
            var SUPPORT_EMAIL = ENV.supportEmail;
            var NO_EMAIL = 'noEmail@zinkerz.com'; // in case the user has no email.

            SupportSrv.connectTeacherWithSupport = function (callbackFn) {
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
                                    UserProfileService.getProfileByUserId(authData.uid).then(function (userProfile) {
                                        var receiverName = userProfile.nickname;
                                        var receiverEmail = authData.auth.email || userProfile.email || NO_EMAIL;
                                        if (angular.isUndefined(receiverName) || angular.equals(receiverName, '')) {
                                            receiverName = receiverEmail;
                                        }

                                        var dataToSend = {
                                            receiverEmail: userProfile.email,
                                            receiverName: receiverName,
                                            receiverUid: authData.uid,
                                            receiverAppName: ENV.firebaseAppScopeName,
                                            receiverParentEmail: '',
                                            receiverParentName: ''
                                        };
                                        InvitationService.connectSupportToUser(dataToSend).then(function () {
                                            callbackFn();
                                        });
                                    });
                                } else {
                                    callbackFn();
                                }
                            });
                        });
                    });
                }
            }

        }
    );
})(angular);



