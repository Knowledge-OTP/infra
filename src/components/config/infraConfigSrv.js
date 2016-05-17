(function (angular) {
    'use strict';

    angular.module('znk.infra.config').provider('InfraConfigSrv', [
        function () {
            var storageServiceName,
                userDataFn,
                globalStorageGetter,
                studentStorageGetter,
                teacherStorageGetter;

            this.setStorages = function(_globalStorageGetter, _studentStorageGetter, _teacherStorageGetter){
                globalStorageGetter = _globalStorageGetter;
                studentStorageGetter = _studentStorageGetter;
                teacherStorageGetter = _teacherStorageGetter;
            };

            this.setUserDataFn = function(_userDataFn) {
                userDataFn = _userDataFn;
            };

            this.$get = [
                '$injector', '$log', '$q',
                function ($injector, $log, $q) {
                    var InfraConfigSrv = {};

                    InfraConfigSrv.getGlobalStorage = function(){
                        if(!globalStorageGetter){
                            $log.error('InfraConfigSrv: global Storage name was not defined');
                            return;
                        }
                        return $injector.invoke(storageServiceName);
                    };

                    InfraConfigSrv.getStudentStorage = function(){
                        if(!studentStorageGetter){
                            $log.error('InfraConfigSrv: student storage service was not defined');
                            return;
                        }
                        return $injector.invoke(studentStorageGetter);
                    };

                    InfraConfigSrv.getTeacherStorage = function(){
                        if(!teacherStorageGetter ){
                            $log.error('InfraConfigSrv: dashboard storage service name was not defined');
                            return;
                        }
                        return $injector.invoke(teacherStorageGetter );
                    };

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
