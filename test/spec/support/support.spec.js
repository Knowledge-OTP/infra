describe('testing service "SupportSrv":', function () {
    'use strict';

    angular.module('znk.infra.auth', [])
        .factory('AuthService', function(){
            return {
                getAuth: function(){
                return {
                    uid: 'fakeUid',
                    auth:{
                        email:'fakeEmail'
                    }
                };
            } }
        });

    angular.module('znk.infra.support')
        .factory('GroupsService', function(){
            return {
                getUserData: function(){
                    return {
                        uid: 'fakeUid',
                        auth:{
                            email:'mockEmail'
                        }
                    };
                } }
        });

    beforeEach(module('znk.infra.support', 'storage.mock', 'testUtility','user.mock', 'env.mock','znk.infra.auth', 'znk.infra.teachers'));

    var _deps = {};
    var resultObject = {
        receiverAppName: 'test_app',
        receiverEmail: 'fakeEmail',
        receiverName: 'fakeEmail',
        receiverUid: 'fakeUid',
        receiverParentEmail: '',
        receiverParentName: ''
    };

    beforeEach(inject(function ($injector) {
        var depsToInject = [
            'TestUtilitySrv',
            'InfraConfigSrv',
            'UserProfileService',
            'SupportSrv',
            '$rootScope',
            'ENV',
            '$q',
            'testUser',
            'teachersSrv',
        ];

        depsToInject.forEach(function (depName) {
            _deps[depName] = $injector.get(depName);
        });

        _deps.GlobalStorage = _deps.TestUtilitySrv.general.asyncToSync(_deps.InfraConfigSrv.getGlobalStorage, _deps.InfraConfigSrv)();
        _deps.getTeacherStorage = _deps.TestUtilitySrv.general.asyncToSync(_deps.InfraConfigSrv.getTeacherStorage, _deps.InfraConfigSrv)();
        _deps.getStudentStorage = _deps.TestUtilitySrv.general.asyncToSync(_deps.InfraConfigSrv.getStudentStorage, _deps.InfraConfigSrv)();
    }));



    it('when student not connected to support connectStudentWithSupport function must send correct data to backend', inject(function($http, _$httpBackend_) {
        var supportDataToBackend;
        var respondFromBackend;
        _$httpBackend_.when('POST', 'https://test/support')
            .respond(function(method, url, data) {         // the "server" returns the data that was send - now we test it.
                supportDataToBackend = angular.fromJson(data);
                return [200, {respond:'ok'}];
            });

        _deps.SupportSrv.connectStudentWithSupport(function(dataToSend){
             respondFromBackend = angular.fromJson(dataToSend.data);
        });

        _$httpBackend_.flush();
        _deps.$rootScope.$digest();

        expect(supportDataToBackend).toEqual(jasmine.objectContaining(resultObject));
        expect(respondFromBackend.respond).toEqual('ok');
    }));

    it('when teacher not connected to support connectStudentWithSupport function must send correct data to backend', inject(function($http, _$httpBackend_) {
        var supportDataToBackend;
        var respondFromBackend;

        _$httpBackend_.when('POST', 'https://test/support')
            .respond(function(method, url, data) {         // the "server" returns the data that was send - now we test it.
                supportDataToBackend = angular.fromJson(data);
                return [200, {respond:'ok'}];
            });

        _deps.SupportSrv.connectTeacherWithSupport(function(dataToSend){
            respondFromBackend = angular.fromJson(dataToSend.data);
        });

        _$httpBackend_.flush();

        _deps.$rootScope.$digest();


        expect(supportDataToBackend).toEqual(jasmine.objectContaining(resultObject));
        expect(respondFromBackend.respond).toEqual('ok');
    }));
});
