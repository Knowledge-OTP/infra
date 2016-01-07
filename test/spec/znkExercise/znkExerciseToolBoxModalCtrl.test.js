xdescribe('testing controller "ZnkExerciseToolBoxModalCtrl":', function () {
    'use strict';

    beforeEach(module('znk.toefl', 'htmlTemplates'));

    var $scope, ZnkExerciseToolBoxModalCtrl, modalSettings, ZnkExerciseDrvSrv;
    beforeEach(inject([
        '$rootScope', '$controller', '$injector',
        function ($rootScope, $controller, $injector) {
            $scope = $rootScope.$new();
            ZnkExerciseDrvSrv = $injector.get('ZnkExerciseDrvSrv');
            modalSettings = {
                events: {
                    onToolOpened: angular.noop,
                    onToolClosed: angular.noop
                }
            };

            ZnkExerciseToolBoxModalCtrl = $controller('ZnkExerciseToolBoxModalCtrl', {
                $scope: $scope,
                events: modalSettings,
                Settings: modalSettings
            });
        }]));

    it('when tool is opened then onToolOpen callback should be triggered and tool status should be true', function () {
        spyOn(modalSettings.events, 'onToolOpened').and.callThrough();
        $scope.d.openTool('tool');
        expect(modalSettings.events.onToolOpened).toHaveBeenCalledWith({tool:'tool'});
        expect($scope.d.toolsStatus['tool']).toBe(true);
    });

    it('when tool is opened then onToolOpen callback should be triggered', function () {
        spyOn(modalSettings.events, 'onToolClosed').and.callThrough();
        $scope.d.closeTool('tool');
        expect(modalSettings.events.onToolClosed).toHaveBeenCalledWith({tool: 'tool'});
        expect($scope.d.toolsStatus['tool']).toBe(false);
    });

    it('when bookmark tool is set to true then then the value binded to the tool should be updated accordingly', function () {
        expect($scope.d.bookmarkTool.value).toBe(undefined);
        modalSettings.actions.setToolValue(ZnkExerciseDrvSrv.toolBoxTools.BOOKMARK,true);
        expect($scope.d.bookmarkTool.value).toBe(true);
    });

    it('when pencil tool box is closed then it status can be retrieved in onClosedTool callback', function () {
        modalSettings.events.onToolOpened = function(evt){
            modalSettings.actions.setToolValue(ZnkExerciseDrvSrv.toolBoxTools.BLACKBOARD,true);
        };
        var pencilStatus;
        modalSettings.events.onToolClosed = function(evt){
            pencilStatus = evt.value;
        };
        $scope.d.openTool(ZnkExerciseDrvSrv.toolBoxTools.BLACKBOARD);
        $scope.d.closeTool(ZnkExerciseDrvSrv.toolBoxTools.BLACKBOARD);
        expect(pencilStatus).toBe(true);
    });

    it('When bookmark icon is clicked then onToolValueChanged event should be triggered with bookmark value',function(){
        var evtObj;
        modalSettings.events.onToolValueChanged = function(evt){
            evtObj = evt;
        };
        $scope.d.reverseBookmarkValue();
        expect(evtObj.value).toBe(true);
        expect(evtObj.tool).toBe(ZnkExerciseDrvSrv.toolBoxTools.BOOKMARK);
        $scope.d.reverseBookmarkValue();
        expect(evtObj.value).toBe(false);
        expect(evtObj.tool).toBe(ZnkExerciseDrvSrv.toolBoxTools.BOOKMARK);
    });

    it('When show/hide icon is clicked then onToolValueChanged event should be triggered with relevant value',function(){
        var evtObj;
        modalSettings.events.onToolValueChanged = function(evt){
            evtObj = evt;
        };
        $scope.d.reverseShowPagerValue();
        expect(evtObj.value).toBe(true);
        expect(evtObj.tool).toBe(ZnkExerciseDrvSrv.toolBoxTools.SHOW_PAGER);
        $scope.d.reverseShowPagerValue();
        expect(evtObj.value).toBe(false);
        expect(evtObj.tool).toBe(ZnkExerciseDrvSrv.toolBoxTools.SHOW_PAGER);
    });
});
