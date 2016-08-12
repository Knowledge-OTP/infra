/**
 * attrs:
 *  settings:
 *      exerciseDrawingPathPrefix
 *      toucheColorId
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseDrawTool',
        function (ZnkExerciseEvents, InfraConfigSrv, $log, $q, $compile, $timeout, $window) {
            'ngInject';

            var TOUCHE_COLORS = {
                0: 0,// deleted
                1: '#0072bc',
                2: '#af667d'
            };

            return {
                templateUrl: 'components/znkExercise/toolbox/tools/draw/znkExerciseDrawToolDirective.template.html',
                require: '^znkExerciseToolBox',
                scope: {
                    settings: '<'
                },
                link: function (scope, element, attrs, toolBoxCtrl) {
                    var canvasDomElement,
                        canvasContext,
                        drawer,
                        eventsManager,
                        serverDrawingUpdater,
                        currQuestion;

                    var PIXEL_SIZE = 2;
                    var SERVER_UPDATED_FLUSH_TIME = 0;

                    var DRAWING_MODES = {
                        'NONE': 1,
                        'VIEW': 2,
                        'VIEW_DRAW': 3,
                        'VIEW_ERASE': 4
                    };

                    var TOOLS = {
                        TOUCHE: 1,
                        PENCIL: 2,
                        ERASER: 3
                    };

                    scope.d = {};

                    scope.d.DRAWING_MODES = DRAWING_MODES;

                    scope.d.TOOLS = TOOLS;

                    scope.d.drawMode = DRAWING_MODES.NONE;

                    scope.d.toolClicked = function (tool) {
                        if(!currQuestion){
                            $log.debug('znkExerciseDrawTool: curr question was not set yet');
                            return;
                        }

                        switch (tool) {
                            case TOOLS.TOUCHE:
                                scope.d.drawMode = scope.d.drawMode === DRAWING_MODES.NONE ? DRAWING_MODES.VIEW : DRAWING_MODES.NONE;
                                break;
                            case TOOLS.PENCIL:
                                scope.d.drawMode = scope.d.drawMode === DRAWING_MODES.VIEW_DRAW ? DRAWING_MODES.VIEW : DRAWING_MODES.VIEW_DRAW;
                                break;
                            case TOOLS.ERASER:
                                scope.d.drawMode = scope.d.drawMode === DRAWING_MODES.VIEW_ERASE ? DRAWING_MODES.VIEW : DRAWING_MODES.VIEW_ERASE;
                                break;
                        }
                    };

                    scope.d.cleanCanvas = function () {
                        drawer.clean();
                        if(!currQuestion){
                            var errMsg = 'znkExerciseDrawTool:_getFbRef: curr question was not set yet';
                            $log.debug(errMsg);
                            return;
                        }

                        _getFbRef(currQuestion.id).then(function (exerciseDrawingRef) {
                            exerciseDrawingRef.set(null);
                        });
                    };

                    function _getFbRef(currQuestionId) {
                        var errMsg;

                        if (!scope.settings || !scope.settings.exerciseDrawingPathPrefix) {
                            errMsg = 'znkExerciseDrawTool';
                            $log.error(errMsg);
                            return $q.reject(errMsg);
                        }

                        if(!currQuestionId){
                            errMsg = 'znkExerciseDrawTool:_getFbRef: curr question was not set yet';
                            $log.debug(errMsg);
                            return $q.reject(errMsg);
                        }

                        var pathPrefixProm;
                        if (angular.isFunction(scope.settings.exerciseDrawingPathPrefix)) {
                            pathPrefixProm = scope.settings.exerciseDrawingPathPrefix();
                        } else {
                            pathPrefixProm = scope.settings.exerciseDrawingPathPrefix;
                        }

                        var dataPromMap = {
                            globalStorage: InfraConfigSrv.getGlobalStorage(),
                            pathPrefix: $q.when(pathPrefixProm)
                        };

                        return $q.all(dataPromMap).then(function (data) {
                            var path = 'exerciseDrawings/' + data.pathPrefix + '/' + currQuestionId;
                            return data.globalStorage.adapter.getRef(path);
                        });
                    }

                    function _getToucheColor(drawMode) {
                        if (drawMode === DRAWING_MODES.VIEW_ERASE) {
                            return 0;
                        }

                        if (!scope.settings.toucheColorId) {
                            $log.error('znkExerciseDrawTool: touche color was not set');
                            return null;
                        }
                        return scope.settings.toucheColorId;
                    }

                    function _setDrawMode(drawMode) {
                        switch (drawMode) {
                            case DRAWING_MODES.NONE:
                                eventsManager.cleanListeners();
                                drawer.clean();
                                break;
                            case DRAWING_MODES.VIEW:
                                eventsManager.killMouseEvents();
                                eventsManager.registerFbListeners(currQuestion.id);
                                break;
                            default:
                                eventsManager.registerMouseEvents();
                                eventsManager.registerFbListeners(currQuestion.id);
                                drawer.toucheColor = _getToucheColor(drawMode);
                        }
                    }

                    function _updateQuestionDrawMode(drawMode) {
                        toolBoxCtrl.getCurrentQuestion().then(function (currQuestion) {
                            currQuestion.__questionStatus.drawingToolViewMode = drawMode;
                        });
                    }

                    function _reloadCanvas(){
                        if(scope.d.drawMode === DRAWING_MODES.NONE){
                            return;
                        }

                        drawer.clean();
                        eventsManager.registerFbListeners(currQuestion.id);
                    }

                    function _init() {
                        var znkExerciseElement = toolBoxCtrl.getZnkExerciseElement();
                        var znkExerciseDomElement = znkExerciseElement[0];

                        var canvasContainerElement = angular.element(
                            '<div class="draw-tool-container" ' +
                            'ng-show="d.drawMode !== d.DRAWING_MODES.NONE" ' +
                            'ng-class="{' +
                            '\'no-pointer-events\': d.drawMode === d.DRAWING_MODES.VIEW,' +
                            '\'crosshair-cursor\': d.drawMode !== d.DRAWING_MODES.NONE && d.drawMode !== d.DRAWING_MODES.VIEW' +
                            '}">' +
                            '<canvas></canvas>' +
                            '</div>'
                        );

                        canvasDomElement = canvasContainerElement.children()[0];
                        toolBoxCtrl.isExerciseReady().then(function () {
                            canvasDomElement.setAttribute('height', znkExerciseDomElement.offsetHeight);
                            canvasDomElement.setAttribute('width', znkExerciseDomElement.offsetWidth);
                        });

                        canvasContext = canvasDomElement.getContext("2d");

                        znkExerciseElement.append(canvasContainerElement);
                        $compile(canvasContainerElement)(scope);

                        drawer = new Drawer();
                        eventsManager = new EventsManager();
                    }

                    function ServerDrawingUpdater(questionUid){
                        if(angular.isUndefined(questionUid)){
                            $log.error('znkExerciseDrawTool: Question id was not provided');
                            return;
                        }

                        this.pixelsMapToUpdate = {};

                        this.exerciseDrawingRefProm = _getFbRef(questionUid);
                    }

                    ServerDrawingUpdater.prototype._triggerServerUpdate = function(){
                        if(this.alreadyTriggered){
                            return;
                        }

                        this.alreadyTriggered = true;

                        var self = this;
                        $timeout(function(){
                            self.alreadyTriggered = false;
                            self.flush();
                        },SERVER_UPDATED_FLUSH_TIME,false);
                    };

                    ServerDrawingUpdater.prototype.update = function(pixelsMapToUpdate){
                        angular.extend(this.pixelsMapToUpdate, pixelsMapToUpdate);
                        this._triggerServerUpdate();
                    };

                    ServerDrawingUpdater.prototype.flush = function(){
                        var self = this;

                        return this.exerciseDrawingRefProm.then(function (exerciseDrawingRef) {
                            exerciseDrawingRef.update(self.pixelsMapToUpdate);
                            self.pixelsMapToUpdate = {};
                        });
                    };

                    function Drawer() {
                        this.lastPoint = null;
                    }

                    Drawer.prototype.drawPixel = function (coordStr, colorId) {
                        if (!canvasContext) {
                            return;
                        }

                        var coords = coordStr.split(":");
                        $window.requestAnimationFrame(function(){
                            canvasContext.fillStyle = TOUCHE_COLORS[colorId];
                            canvasContext.fillRect(parseInt(coords[0]), parseInt(coords[1]), PIXEL_SIZE, PIXEL_SIZE);
                        });
                    };

                    Drawer.prototype.clearPixel = function (coordStr) {
                        if (!canvasContext) {
                            return;
                        }

                        var coords = coordStr.split(":");

                        $window.requestAnimationFrame(function(){
                            canvasContext.clearRect(parseInt(coords[0]) - PIXEL_SIZE, parseInt(coords[1])- PIXEL_SIZE, 2 * PIXEL_SIZE, 2 * PIXEL_SIZE);
                        });
                    };

                    Drawer.prototype.draw = function (e) {
                        var self = this;

                        var currXCoor = e.offsetX;
                        var currYCoor = e.offsetY;

                        var prevXCoor = self.lastPoint ? self.lastPoint[0] : currXCoor - 1;
                        var prevYCoor = self.lastPoint ? self.lastPoint[1] : currYCoor - 1;

                        self.lastPoint = [currXCoor, currYCoor];

                        var xDiff = Math.abs(currXCoor - prevXCoor);
                        var yDiff = Math.abs(currYCoor - prevYCoor);

                        var pixelsNumToDraw = Math.max(xDiff, yDiff);
                        var xStepOffset = xDiff / pixelsNumToDraw;
                        var yStepOffset = yDiff / pixelsNumToDraw;
                        var pixelsToDrawMap = {};
                        for (var i = 1; i <= pixelsNumToDraw; i++) {
                            var pixelXOffset = (currXCoor - prevXCoor > 0) ? 1 : -1;
                            pixelXOffset *= Math.round(i * xStepOffset);

                            var pixelYOffset = (currYCoor - prevYCoor > 0) ? 1 : -1;
                            pixelYOffset *= Math.round(i * yStepOffset);

                            var pixelToDrawXCoor = Math.round(prevXCoor + pixelXOffset);
                            var pixelToDrawYCoor = Math.round(prevYCoor + pixelYOffset);

                            pixelsToDrawMap[pixelToDrawXCoor + ':' + pixelToDrawYCoor] = self.toucheColor;
                        }

                        angular.forEach(pixelsToDrawMap, function (color, coordsStr) {
                            if (color) {
                                self.drawPixel(coordsStr, color);
                            } else {
                                self.clearPixel(coordsStr);
                            }
                        });

                        serverDrawingUpdater.update(pixelsToDrawMap);
                    };

                    Drawer.prototype.stopDrawing = function () {
                        this.lastPoint = null;
                    };

                    Drawer.prototype.clean = function () {
                        canvasContext.clearRect(0, 0, canvasDomElement.offsetWidth, canvasDomElement.offsetHeight);
                    };

                    function _fbChildChanged(snapShot) {
                        var coordsStr = snapShot.key();
                        var color = snapShot.val();

                        if(color === 0){
                            drawer.clearPixel(coordsStr);
                        }else{
                            drawer.drawPixel(coordsStr, color);
                        }
                    }

                    function _fbChildRemoved(snapShot) {
                        var coordsStr = snapShot.key();
                        drawer.clearPixel(coordsStr);
                    }

                    function _mousemoveCb(evt) {
                        drawer.draw(evt);
                        evt.stopImmediatePropagation();
                        evt.preventDefault();
                        return false;
                    }

                    function _mousedownCb(evt) {
                        //left mouse
                        if (evt.which === 1) {
                            canvasDomElement.addEventListener('mousemove', _mousemoveCb);
                            canvasDomElement.addEventListener('mouseup', _mouseupCb);
                            evt.stopImmediatePropagation();
                            evt.preventDefault();
                            return false;
                        }
                    }

                    function _mouseupCb(evt) {
                        //left mouse
                        if (evt.which === 1) {
                            drawer.stopDrawing();
                            canvasDomElement.removeEventListener('mousemove', _mousemoveCb);
                            canvasDomElement.removeEventListener('mouseup', _mouseupCb);
                            evt.stopImmediatePropagation();
                            evt.preventDefault();
                            return false;
                        }
                    }

                    function EventsManager() {
                        this._fbRegisterProm = $q.when();
                    }

                    EventsManager.prototype.registerMouseEvents = function () {
                        if (this._mouseEventsRegistered) {
                            return;
                        }
                        this._mouseEventsRegistered = true;

                        canvasDomElement.addEventListener('mousedown', _mousedownCb);
                    };

                    EventsManager.prototype.killMouseEvents = function () {
                        canvasDomElement.removeEventListener('mousedown', _mousedownCb);
                        canvasDomElement.removeEventListener('mouseup', _mouseupCb);
                        canvasDomElement.removeEventListener('mousemove', _mousemoveCb);

                        this._mouseEventsRegistered = null;
                    };

                    EventsManager.prototype.registerFbListeners = function (questionId) {
                        if(angular.isUndefined(questionId)){
                            $log.error('znkExerciseDrawTool:registerFbListeners: questionId was not provided');
                            return;
                        }

                        var self = this;

                        return _getFbRef(questionId).then(function (ref) {
                            if(self.ref){
                                if(self.ref.key() === ref.key()){
                                    return;
                                }
                                self.killFbListeners();
                            }

                            self.ref = ref;

                            self.ref.on("child_added", _fbChildChanged);
                            self.ref.on("child_changed", _fbChildChanged);
                            self.ref.on("child_removed", _fbChildRemoved);
                        });
                    };

                    EventsManager.prototype.killFbListeners = function () {
                        if(!this.ref){
                            return;
                        }

                        this.ref.off("child_added", _fbChildChanged);
                        this.ref.off("child_changed", _fbChildChanged);
                        this.ref.off("child_removed", _fbChildRemoved);

                        this.ref = null;
                    };

                    EventsManager.prototype.cleanListeners = function () {
                        this.killMouseEvents();
                        this.killFbListeners();
                    };

                    scope.$watch('d.drawMode', function (newDrawMode) {
                        if (!newDrawMode) {
                            return;
                        }

                        _setDrawMode(newDrawMode);
                        _updateQuestionDrawMode(newDrawMode);
                    });

                    scope.$on('$destroy', function () {
                        eventsManager.cleanListeners();
                    });

                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex, oldIndex, _currQuestion) {
                        currQuestion = _currQuestion;

                        if(serverDrawingUpdater){
                            serverDrawingUpdater.flush();
                        }
                        serverDrawingUpdater = new ServerDrawingUpdater(currQuestion.id);

                        _reloadCanvas();
                    });

                    _init();
                }
            };
        });
})(angular);

