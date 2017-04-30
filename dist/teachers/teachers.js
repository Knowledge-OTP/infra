(function (angular) {
    'use strict';

    /**
     api:
     getAllTeachers: returns all teachers of current user as objects
     with the properties: teachers uid, teacher name and teacher email.
     getTeacher: returns specific teacher by teacher uid.
     * */

    angular.module('znk.infra.teachers').service('teachersSrv',
        ["InfraConfigSrv", function (InfraConfigSrv) {
            'ngInject';

            var self = this;
            var INVITATION_PATH = "users/$$uid/invitations/approved";

            self.getAllTeachers = function () {
                return InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    return studentStorage.get(INVITATION_PATH).then(function (teachers) {
                        return angular.isDefined(teachers) ? _createNewTeachersObj(teachers) : null;
                    });
                });
            };

            self.getTeacher = function (teacherUid) {
                self.getAllTeachers().then(function (allTeachers) {
                    if (angular.isDefined(allTeachers[teacherUid])) {
                        return allTeachers[teacherUid];
                    }
                });
            };

            function _createNewTeachersObj(oldTeachersObj) {
                var newTeacherObj = {};
                var teachersKeys = Object.keys(oldTeachersObj);
                angular.forEach(teachersKeys, function (value) {
                    var teacherUid = oldTeachersObj[value].senderUid;
                    newTeacherObj[teacherUid] = {};
                    newTeacherObj[teacherUid].name = oldTeachersObj[value].senderName;
                    newTeacherObj[teacherUid].uid = oldTeachersObj[value].senderUid;
                    newTeacherObj[teacherUid].email = oldTeachersObj[value].senderEmail;
                });
                return newTeacherObj;
            }

        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.teachers', [
        
    ]);
})(angular);

angular.module('znk.infra.teachers').run(['$templateCache', function($templateCache) {

}]);
