describe('testing service "StudentContextSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.userContext', 'htmlTemplates', 'testUtility'));

    var StudentContextSrv, $q, $window;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            StudentContextSrv = $injector.get('StudentContextSrv');
            $q = $injector.get('$q');
            $window = $injector.get('$window');
        }
    ]));

    it('when initializing, student current uid is empty', function () {
        expect(StudentContextSrv.getCurrUid()).toEqual('');
    });

    it('when set a spesific student uid, this is the returned student current uid', function () {
        var _studentUid = 'abcd-12345-efgh-7890';
        
        StudentContextSrv.setCurrentUid(_studentUid);
        expect(StudentContextSrv.getCurrUid()).toEqual(_studentUid);
    });

    afterEach(function () {
       // to prevent the error of failed test, when tests are 
       // running more then once (auto)
       // clean sessionStorage after each test 
       $window.sessionStorage.removeItem('currentStudentUid');  
    });    

});
