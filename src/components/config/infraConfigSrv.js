(function (angular) {
    'use strict';

    angular.module('znk.infra.config').provider('InfraConfigSrv', [
        function () {
            var userDataFn,
                storages = {};

            this.setStorages = function(_globalStorageGetter, _studentStorageGetter, _teacherStorageGetter){
                storages.globalGetter = _globalStorageGetter;
                storages.studentGetter = _studentStorageGetter;
                storages.teacherGetter = _teacherStorageGetter;
            };

            this.setUserDataFn = function(_userDataFn) {
                userDataFn = _userDataFn;
            };

            this.$get = [
                '$injector', '$log', '$q',
                function ($injector, $log, $q) {
                    var InfraConfigSrv = {};

                    function _baseStorageGetter(name){
                        var storageGetterKey = name + 'Getter';
                        var storageGetter = storages[storageGetterKey];
                        if(!storageGetter ){
                            var errMsg = 'InfraConfigSrv: ' + name + ' Storage name was not defined';
                            $log.error(errMsg);
                            return $q.reject(errMsg);
                        }
                        return $q.when($injector.invoke(storageGetter));
                    }

                    InfraConfigSrv.getGlobalStorage = _baseStorageGetter.bind(InfraConfigSrv, 'global');

                    InfraConfigSrv.getStudentStorage = _baseStorageGetter.bind(InfraConfigSrv, 'student');

                    InfraConfigSrv.getTeacherStorage = _baseStorageGetter.bind(InfraConfigSrv, 'teacher');

                    InfraConfigSrv.getUserData = function(){
                        var userDataInjected;
                        if(!userDataFn){
                            $log.debug('InfraConfigSrv: auth fn name was not defined');
                            return;
                        }
                        userDataInjected = $injector.invoke(userDataFn);
                        return $q.when(userDataInjected);
                    };

                    return InfraConfigSrv;
                }
            ];
        }
    ]);
})(angular);
