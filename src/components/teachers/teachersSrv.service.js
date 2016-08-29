(function (angular) {
    'use strict';

    /**
        api:
            getAllTeachers: returns all teachers of current user as objects
                             with the properties: teachers uid, teacher name.
            getTeacher: returns specific teacher by teacher uid.
     * */

    angular.module('znk.infra.teachers').service('teachersSrv',
        function (InfraConfigSrv) {
            'ngInject';

            var self = this;
            var INVITATION_PATH = "users/$$uid/invitations/approved";

            self.getAllTeachers = function () {
                return InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    return studentStorage.get(INVITATION_PATH).then(function(teachers){
                       return  _createNewTeachersObj(teachers);
                    })
                })
            };

            self.getTeacher = function(teacherUid){
                self.getAllTeachers().then(function(allTeachers){
                    if(angular.isDefined(allTeachers[teacherUid])) {
                        return  allTeachers
                    }
                });
            };

            function _createNewTeachersObj(oldTeachersObj){
                var newTeacherObj = {};
                var teachersKeys = Object.keys(oldTeachersObj);
                angular.forEach(teachersKeys, function(value) {
                    var teacherUid = oldTeachersObj[value].senderUid;
                    newTeacherObj[teacherUid] = {};
                    newTeacherObj[teacherUid].name = oldTeachersObj[value].senderName;
                });
                return newTeacherObj;
            }

        }
    );
})(angular);
