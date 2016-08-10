/**
 * attrs:
 *  settings:
 *      exerciseDrawingPathPrefix
 *      toucheColorId
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseDrawTool',
        function (ZnkExerciseEvents, InfraConfigSrv, $log, $q, $compile, $timeout) {
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
                        pixSize = 4;

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
                        _getFbRef().then(function (exerciseDrawingRef) {
                            exerciseDrawingRef.set(null);
                        });
                    };

                    function _getFbRef() {
                        if (!scope.settings || !scope.settings.exerciseDrawingPathPrefix) {
                            var errMsg = 'znkExerciseDrawTool';
                            $log.error(errMsg);
                            return $q.reject(errMsg);
                        }

                        var pathPrefixProm;
                        if (angular.isFunction(scope.settings.exerciseDrawingPathPrefix)) {
                            pathPrefixProm = scope.settings.exerciseDrawingPathPrefix();
                        } else {
                            pathPrefixProm = scope.settings.exerciseDrawingPathPrefix;
                        }

                        var dataPromMap = {
                            currQuestion: toolBoxCtrl.getCurrentQuestion(),
                            globalStorage: InfraConfigSrv.getGlobalStorage(),
                            pathPrefix: $q.when(pathPrefixProm)
                        };
                        return $q.all(dataPromMap).then(function (data) {
                            var path = 'exerciseDrawings/' + data.pathPrefix + '/' + data.currQuestion.id;
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

                    function _mousemoveCb(evt) {
                        drawer.draw(evt);
                    }

                    function _mousedownCb(evt) {
                        //left mouse
                        if (evt.which === 1) {
                            $timeout(function () {
                                scope.d.mouseDown = true;
                            });
                            canvasDomElement.addEventListener('mousemove', _mousemoveCb);
                            canvasDomElement.addEventListener('mouseup', _mouseupCb);
                        }
                    }

                    function _mouseupCb(evt) {
                        //left mouse
                        if (evt.which === 1) {
                            $timeout(function () {
                                scope.d.mouseDown = false;
                            });
                            drawer.stopDrawing();
                            canvasDomElement.removeEventListener('mousemove', _mousemoveCb);
                            canvasDomElement.removeEventListener('mouseup', _mouseupCb);
                        }
                    }

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

                    function _setDrawMode(drawMode) {
                        switch (drawMode) {
                            case DRAWING_MODES.NONE:
                                eventsManager.cleanListeners();
                                break;
                            case DRAWING_MODES.VIEW:
                                eventsManager.killMouseEvents();
                                eventsManager.registerFbListeners();
                                break;
                            default:
                                eventsManager.registerMouseEvents();
                                eventsManager.registerFbListeners();
                                drawer.toucheColor = _getToucheColor(drawMode);
                        }
                    }

                    function _updateQuestionDrawMode(drawMode) {
                        toolBoxCtrl.getCurrentQuestion().then(function (currQuestion) {
                            currQuestion.__questionStatus.drawingToolViewMode = drawMode;
                        });
                    }

                    function ServerDrawingUpdater(){
                        this.pixelsMapToUpdate = {};
                    }

                    ServerDrawingUpdater.prototype._triggerServerUpdate = function(){
                        if(this.exerciseDrawingRefProm){
                            return;
                        }

                        this.exerciseDrawingRefProm = _getFbRef();

                        var FLUSH_TIME = 0;
                        var self = this;
                        $timeout(function(){
                            self.flush();
                        },FLUSH_TIME,false);
                    };

                    ServerDrawingUpdater.prototype.update = function(pixelsMapToUpdate){
                        angular.extend(this.pixelsMapToUpdate, pixelsMapToUpdate);
                        this._triggerServerUpdate();
                    };

                    ServerDrawingUpdater.prototype.flush = function(){
                        var self = this;
                        if(!this.exerciseDrawingRefProm){
                            return $q.when();
                        }

                        return this.exerciseDrawingRefProm.then(function (exerciseDrawingRef) {
                            self.exerciseDrawingRefProm = null;
                            exerciseDrawingRef.update(self.pixelsMapToUpdate);
                            self.pixelsMapToUpdate = {};
                        });
                    };

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
                        serverDrawingUpdater = new ServerDrawingUpdater();
                    }

                    function Drawer() {
                        this.lastPoint = null;
                    }

                    Drawer.prototype.drawPixel = function (coordStr, colorId) {
                        if (!canvasContext) {
                            return;
                        }

                        var coords = coordStr.split(":");
                        canvasContext.fillStyle = TOUCHE_COLORS[colorId];
                        canvasContext.fillRect(parseInt(coords[0]), parseInt(coords[1]), pixSize, pixSize);
                    };

                    Drawer.prototype.clearPixel = function (coordStr) {
                        if (!canvasContext) {
                            return;
                        }

                        var coords = coordStr.split(":");

                        canvasContext.clearRect(parseInt(coords[0]) - pixSize, parseInt(coords[1])- pixSize, 2 * pixSize, 2 * pixSize);
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

                    EventsManager.prototype.registerFbListeners = function () {
                        var self = this;

                        this._fbRegisterProm = this._fbRegisterProm.then(function () {
                            return _getFbRef().then(function (fbRef) {
                                if (self._fbEventsRegistered) {
                                    return;
                                }

                                self._fbEventsRegistered = true;

                                fbRef.on("child_added", _fbChildChanged);
                                fbRef.on("child_changed", _fbChildChanged);
                                fbRef.on("child_removed", _fbChildRemoved);
                            });
                        });
                    };

                    EventsManager.prototype.killMouseEvents = function () {
                        this._mouseEventsRegistered = false;

                        canvasDomElement.removeEventListener('mousedown', _mousedownCb);
                        canvasDomElement.removeEventListener('mouseup', _mouseupCb);
                        canvasDomElement.removeEventListener('mousemove', _mousemoveCb);
                    };

                    EventsManager.prototype.killFbListeners = function () {
                        var self = this;

                        this._fbRegisterProm = this._fbRegisterProm.then(function () {
                            return _getFbRef().then(function (fbRef) {
                                self._fbEventsRegistered = false;

                                fbRef.off("child_added", drawer.drawPixel);
                                fbRef.off("child_changed", drawer.drawPixel);
                                fbRef.off("child_removed", drawer.clearPixel);
                            });
                        });
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

                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function () {
                        serverDrawingUpdater.flush().then(function(){
                            drawer.clean();
                            eventsManager.cleanListeners();
                            toolBoxCtrl.getCurrentQuestion().then(function (currQuestion) {
                                var questionDrawMode = currQuestion.__questionStatus.drawingToolViewMode || DRAWING_MODES.NONE;
                                scope.d.drawMode = questionDrawMode;
                            });
                        });
                    });

                    _init();
                }
            };
        });
})(angular);

