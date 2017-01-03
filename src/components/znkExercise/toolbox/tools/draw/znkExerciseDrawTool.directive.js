/**
 * attrs:
 *  settings:
 *      exerciseDrawingPathPrefix
 *      toucheColorId
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseDrawTool',
        function (ZnkExerciseEvents, ZnkExerciseDrawSrv, InfraConfigSrv, ZnkExerciseViewModeEnum, $log, $q, $compile, $timeout, $window) {
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

                    // Don't operate when viewing 'diagnostic' page. (temporary (?) solution to the firebase multiple error bugs in sat/act) - Guy
                    if (ZnkExerciseViewModeEnum.MUST_ANSWER.enum === toolBoxCtrl.znkExerciseCtrl.getViewMode()) {
                        return;
                    }

                    var canvasDomElement,
                        canvasContext,
                        canvasContainerElementInitial,
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

                    scope.d.toolClicked = function (tool) {
                        if (!currQuestion) {
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

                    function _getFbRef(currQuestionId, canvasContextName) {
                        var errMsg;

                        if (!scope.settings || !scope.settings.exerciseDrawingPathPrefix) {
                            errMsg = 'znkExerciseDrawTool';
                            $log.error(errMsg);
                            return $q.reject(errMsg);
                        }

                        if (!currQuestionId) {
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
                            var path = 'exerciseDrawings/' + data.pathPrefix + '/' + currQuestionId + '/' + canvasContextName;
                            return data.globalStorage.adapter.getRef(path);
                        });

                    }

                    function _getCanvasContextByContextName(canvasContextName) {
                        return ZnkExerciseDrawSrv.canvasContextManager[currQuestion.id][canvasContextName];
                    }

                    function _getCanvasContextNamesOfQuestion(questionId) {
                        var canvasContextObj = ZnkExerciseDrawSrv.canvasContextManager[questionId] || {};
                        return Object.keys(canvasContextObj);
                    }

                    scope.d.cleanCanvas = function () {
                        if (!currQuestion) {
                            var errMsg = 'znkExerciseDrawTool:_getFbRef: curr question was not set yet';
                            $log.error(errMsg);
                            return;
                        }

                        // for each canvas in the current page (the current question), set the global canvasContext to it and clear it using drawer.clean()
                        var canvasContextNames = _getCanvasContextNamesOfQuestion(currQuestion.id);
                        angular.forEach(canvasContextNames, function (canvasContextName) {
                            canvasContext = _getCanvasContextByContextName(canvasContextName);
                            drawer.clean();
                            _getFbRef(currQuestion.id, canvasContextName).then(function (exerciseDrawingRef) {
                                exerciseDrawingRef.set(null);
                            });

                        });
                    };


                    function _getToucheColor(drawMode) {
                        if (drawMode === DRAWING_MODES.VIEW_ERASE) {
                            return 0;
                        }

                        if (!scope.settings || angular.isUndefined(scope.settings.toucheColorId)) {
                            $log.debug('znkExerciseDrawTool: touche color was not set');
                            return 1;
                        }

                        return scope.settings.toucheColorId;
                    }

                    function _setDrawMode(drawMode) {
                        switch (drawMode) {
                            case DRAWING_MODES.NONE:
                                eventsManager.cleanQuestionListeners();
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

                    function ServerDrawingUpdater(questionUid, canvasContextName) {
                        if (angular.isUndefined(questionUid)) {
                            $log.error('znkExerciseDrawTool: Question id was not provided');
                            return;
                        }

                        this.pixelsMapToUpdate = {};

                        this.exerciseDrawingRefProm = _getFbRef(questionUid, canvasContextName);
                    }

                    ServerDrawingUpdater.prototype._triggerServerUpdate = function () {
                        if (this.alreadyTriggered) {
                            return;
                        }

                        this.alreadyTriggered = true;

                        var self = this;
                        $timeout(function () {
                            self.alreadyTriggered = false;
                            self.flush();
                        }, SERVER_UPDATED_FLUSH_TIME, false);
                    };

                    ServerDrawingUpdater.prototype.update = function (pixelsMapToUpdate) {
                        angular.extend(this.pixelsMapToUpdate, pixelsMapToUpdate);
                        this._triggerServerUpdate();
                    };

                    ServerDrawingUpdater.prototype.flush = function () {
                        var self = this;

                        return this.exerciseDrawingRefProm.then(function (exerciseDrawingRef) {
                            exerciseDrawingRef.child('coordinates').update(self.pixelsMapToUpdate);
                            self.pixelsMapToUpdate = {};
                        });
                    };

                    function Drawer() {
                        this.lastPoint = null;
                    }

                    Drawer.prototype.drawPixel = function (coordStr, colorId, canvasToChange) {
                        if (!canvasContext && !canvasToChange) {
                            return;
                        }

                        // relevant canvas can be either passed to the function or be the global one
                        canvasToChange = canvasToChange || canvasContext;

                        var coords = coordStr.split(":");
                        $window.requestAnimationFrame(function () {
                            canvasToChange.fillStyle = TOUCHE_COLORS[colorId];
                            canvasToChange.fillRect(parseInt(coords[0]), parseInt(coords[1]), PIXEL_SIZE, PIXEL_SIZE);
                        });
                    };

                    Drawer.prototype.clearPixel = function (coordStr, canvasToChange) {
                        if (!canvasContext && !canvasToChange) {
                            return;
                        }

                        // relevant canvas can be either passed to the function or be the global one
                        canvasToChange = canvasToChange || canvasContext;

                        var coords = coordStr.split(":");

                        $window.requestAnimationFrame(function () {
                            var xCoord = parseInt(coords[0]);
                            var yCoord = parseInt(coords[1]);
                            var width = 10 * PIXEL_SIZE;
                            var height = 10 * PIXEL_SIZE;
                            var xOffset = width / 2;
                            var yOffset = height / 2;
                            canvasToChange.clearRect(xCoord - xOffset, yCoord - yOffset, width, height);
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
                        if (!canvasContext) {
                            return;
                        }
                        canvasContext.clearRect(0, 0, canvasDomElement.offsetWidth, canvasDomElement.offsetHeight);
                    };

                    function _mousemoveCb(evt) {
                        drawer.draw(evt);
                        evt.stopImmediatePropagation();
                        evt.preventDefault();
                        return false;
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

                    function _updateQuestionDrawMode(drawMode) {
                        toolBoxCtrl.getCurrentQuestion().then(function (currQuestion) {
                            currQuestion.__questionStatus.drawingToolViewMode = drawMode;
                        });
                    }

                    scope.$watch('d.drawMode', function (newDrawMode) {
                        if (!newDrawMode) {
                            return;
                        }

                        _setDrawMode(newDrawMode);
                        _updateQuestionDrawMode(newDrawMode);
                    });

                    scope.$on('$destroy', function () {
                        eventsManager.cleanQuestionListeners();
                        eventsManager.cleanGlobalListeners();

                    });

                    function EventsManager() {
                        this._fbRegisterProm = $q.when();
                        this._fbCallbackEnum =
                            {
                                CHILD_CHANGED: 0,
                                CHILD_REMOVED: 1
                            };
                    }

                    EventsManager.prototype.registerHoverEvent = function (elementToHoverOn, onHoverCb) {
                        var domElementToHoverOn = elementToHoverOn[0];

                        domElementToHoverOn.addEventListener("mouseenter", onHoverCb);

                        if (!this._hoveredElements) {
                            this._hoveredElements = [];
                        }

                        this._hoveredElements.push({ 'hoveredElement': elementToHoverOn, 'onHoverCb': onHoverCb });
                    };


                    EventsManager.prototype.killHoverEvents = function () {
                        angular.forEach(this._hoveredElements, function (elementAndCbPair) {
                            var domHoveredElement = elementAndCbPair.hoveredElement[0];
                            domHoveredElement.removeEventListener("mouseenter", elementAndCbPair.onHoverCb);
                        });
                    };

                    EventsManager.prototype.registerMouseEvents = function () {
                        if (this._mouseEventsRegistered || !canvasDomElement) {
                            return;
                        }
                        this._mouseEventsRegistered = true;

                        canvasDomElement.addEventListener('mousedown', _mousedownCb);
                    };

                    EventsManager.prototype.killMouseEvents = function () {
                        if (this._mouseEventsRegistered) {
                            canvasDomElement.removeEventListener('mousedown', _mousedownCb);
                            canvasDomElement.removeEventListener('mouseup', _mouseupCb);
                            canvasDomElement.removeEventListener('mousemove', _mousemoveCb);
                        }
                        this._mouseEventsRegistered = null;
                    };

                    var _fbChildCallbackWrapper = function (canvasContextName, fbCallbackNum) {

                        function _fbChildChanged(snapShot) {
                            var canvasToChange = _getCanvasContextByContextName(canvasContextName);
                            var coordsStr = snapShot.key();
                            var color = snapShot.val();

                            if (color === 0) {
                                drawer.clearPixel(coordsStr, canvasToChange);
                            } else {
                                drawer.drawPixel(coordsStr, color, canvasToChange);
                            }
                        }

                        function _fbChildRemoved(snapShot) {
                            var canvasToChange = _getCanvasContextByContextName(canvasContextName); // "this" refers to context passed to ref.on in registerFbListeners

                            var coordsStr = snapShot.key();
                            drawer.clearPixel(coordsStr, canvasToChange);
                        }

                        switch (fbCallbackNum) {
                            case eventsManager._fbCallbackEnum.CHILD_CHANGED:
                                return _fbChildChanged;
                            case eventsManager._fbCallbackEnum.CHILD_REMOVED:
                                return _fbChildRemoved;
                            default:
                                $log.error('znkExerciseDrawTool:_fbChildCallbackWrapper: wrong fbCallbackNum received!');
                                return;
                        }
                    };

                    var _registerFbListeners = function(questionId) {
                        if (angular.isUndefined(questionId)) {
                            $log.error('znkExerciseDrawTool:registerFbListeners: questionId was not provided');
                            return;
                        }

                        var self = this;

                        if (self._fbLastRegisteredQuestionId === questionId) {
                            return;
                        }
                        else {
                            self.killFbListeners();
                        }

                        var canvasContextNames = _getCanvasContextNamesOfQuestion(questionId);

                        angular.forEach(canvasContextNames, function (canvasContextName) {
                            _getFbRef(questionId, canvasContextName).then(function (ref) {
                                self.ref = ref;

                                self.ref.child('coordinates').on("child_added", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.child('coordinates').on("child_changed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.child('coordinates').on("child_removed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_REMOVED));

                            });

                        });

                        self._fbLastRegisteredQuestionId = questionId;
                    }

                    EventsManager.prototype.registerFbListeners = function (questionId) {
                        /* this wrapper was made because of a bug that occurred sometimes when user have entered
                           the first question in exercise which has a drawing, and the canvas is empty.
                           as it seems, the problem is that the callback from firebase is invoked to soon, before the 
                           canvas has fully loaded (even tho it seems that the canvas alreay appended and compiled), 
                           still the canvas is empty, because there's no holding ground for when it will be ok to draw,
                           the solution for now it's to wait 1 sec and then register callbacks and try drawing.
                        */

                        $timeout(function () {
                            _registerFbListeners(questionId);
                        }, 1000);
                    };


                    EventsManager.prototype.killFbListeners = function () {

                        var self = this;

                        var canvasContextNames = _getCanvasContextNamesOfQuestion(self._fbLastRegisteredQuestionId);
                        angular.forEach(canvasContextNames, function (canvasContextName) {
                            _getFbRef(self._fbLastRegisteredQuestionId, canvasContextName).then(function (ref) {
                                self.ref = ref;

                                self.ref.child('coordinates').off("child_added", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.child('coordinates').off("child_changed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.child('coordinates').off("child_removed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_REMOVED));
                            });
                        });
                        self._fbLastRegisteredQuestionId = null;
                    };

                    EventsManager.prototype.cleanQuestionListeners = function () {
                        this.killMouseEvents();
                        this.killFbListeners();
                        this.killHoverEvents();
                    };

                    EventsManager.prototype.registerDimensionsListener = function (dimensionsRef, onValueCb) {
                        if (!this._dimensionsRefPairs) {
                            this._dimensionsRefPairs = [];
                        }
                        dimensionsRef.on('value', onValueCb);
                        this._dimensionsRefPairs.push({ dimensionsRef: dimensionsRef, onValueCb: onValueCb });
                    };

                    EventsManager.prototype.killDimensionsListener = function () {
                        angular.forEach(this._dimensionsRefPairs, function (refAndCbPair) {
                            refAndCbPair.dimensionsRef.off("value", refAndCbPair.onValueCb);
                        });
                    };

                    EventsManager.prototype.cleanGlobalListeners = function () {
                        this.killDimensionsListener();
                    };

                    function _reloadCanvas() {
                        if (scope.d.drawMode === DRAWING_MODES.NONE) {
                            return;
                        }
                        eventsManager.registerFbListeners(currQuestion.id);
                    }

                    function _init() {
                        canvasContainerElementInitial = angular.element(
                            '<div class="draw-tool-container" ' +
                            'ng-show="d.drawMode !== d.DRAWING_MODES.NONE" ' +
                            'ng-class="{' +
                            '\'no-pointer-events\': d.drawMode === d.DRAWING_MODES.VIEW,' +
                            '\'crosshair-cursor\': d.drawMode !== d.DRAWING_MODES.NONE && d.drawMode !== d.DRAWING_MODES.VIEW' +
                            '}">' +
                            '<canvas></canvas>' +
                            '</div>'
                        );

                        drawer = new Drawer();
                        eventsManager = new EventsManager();
                    }

                    function _setContextOnHover(elementToHoverOn, canvasOfElement, canvasContextName) {

                        var onHoverCb = function () {
                            if (currQuestion) {
                                drawer.stopDrawing();
                                eventsManager.killMouseEvents();

                                canvasDomElement = canvasOfElement;
                                canvasContext = canvasDomElement.getContext("2d");
                                serverDrawingUpdater = new ServerDrawingUpdater(currQuestion.id, canvasContextName);

                                eventsManager.registerMouseEvents();
                            }
                        };

                        eventsManager.registerHoverEvent(elementToHoverOn, onHoverCb);

                    }

                    function _setCanvasDimensions(canvasDomContainerElement, elementToCoverDomElement, canvasContextName, questionId) {
                        toolBoxCtrl.isExerciseReady().then(function () {
                            var exerciseDrawingRefProm;

                            // get the height and the width of the wrapper element
                            function _getDimensionsByElementSize() {
                                var height, width;
                                if (elementToCoverDomElement.scrollHeight) {
                                    height = elementToCoverDomElement.scrollHeight;
                                }
                                else {
                                    height = elementToCoverDomElement.offsetHeight;
                                }
                                if (elementToCoverDomElement.scrollWidth) {
                                    width = elementToCoverDomElement.scrollWidth;
                                }
                                else {
                                    width = elementToCoverDomElement.offsetWidth;
                                }
                                return { height: height, width: width };
                            }

                            // return the larger dimensions out of the element's dimensions and the saved FB dimensions
                            function _compareFbDimensionsWithElementDimensions(fbDimensions) {
                                var elementDimensions = _getDimensionsByElementSize();
                                var finalDimensions = {
                                    height: Math.max(elementDimensions.height, fbDimensions.height),
                                    width: Math.max(elementDimensions.width, fbDimensions.width)
                                };
                                exerciseDrawingRefProm.child('maxDimensions').update(finalDimensions);
                                return finalDimensions;
                            }

                            // set the canvas dimensions to the larger dimensions between the two ^
                            var setDimensionsCb = function (data) {
                                // DOM dimensions
                                var elementDimensions = _getDimensionsByElementSize();
                                // FB dimensions
                                var maxDimensions;
                                // nothing is saved on FB, set the dimensions to be element dimensions
                                if (!data.val()) {
                                    maxDimensions = elementDimensions;
                                }
                                else {
                                    maxDimensions = data.val();
                                }
                                // compare them and set the canvas dimensions to be the larger between the two
                                // also save the new maxDimensions to FB
                                var finalDimensions = _compareFbDimensionsWithElementDimensions(maxDimensions);
                                canvasDomContainerElement[0].setAttribute('height', finalDimensions.height);
                                canvasDomContainerElement[0].setAttribute('width', finalDimensions.width);
                                canvasDomContainerElement.css('position', 'absolute');

                            };

                            // this piece of code fetches the previously calculated maxDimensions from firebase, and then kickstart all the functions we just went by above ^
                            _getFbRef(questionId, canvasContextName).then(function (ref) {
                                exerciseDrawingRefProm = ref;
                                eventsManager.registerDimensionsListener(exerciseDrawingRefProm.child('maxDimensions'), setDimensionsCb);
                            });



                        });

                    }

                    function addCanvasToElement(elementToCover, question) {
                        // we clone the element defined in _init to not mess with the upcoming append function (which doesn't work multiple times using the same element)
                        var canvasContainerElement = canvasContainerElementInitial.clone();
                        // cast selector element to html element
                        var elementToCoverDomElement = elementToCover[0];

                        // get the <canvas> element from the container
                        var canvasDomContainerElement = canvasContainerElement.children();
                        canvasDomElement = canvasDomContainerElement[0];

                        canvasContext = canvasDomElement.getContext("2d");

                        // this is the attribute name passed to znkExerciseDrawContainer directive
                        var canvasContextName = elementToCover.attr('canvas-name');

                        // when hovering over a canvas, set the global context to it
                        _setContextOnHover(elementToCover, canvasDomElement, canvasContextName);

                        _setCanvasDimensions(canvasDomContainerElement, elementToCoverDomElement, canvasContextName, question.id);


                        elementToCover.append(canvasContainerElement);
                        $compile(canvasContainerElement)(scope);

                        // save to service for further management
                        if (!ZnkExerciseDrawSrv.canvasContextManager[question.id]) {
                            ZnkExerciseDrawSrv.canvasContextManager[question.id] = {};
                        }

                        ZnkExerciseDrawSrv.canvasContextManager[question.id][canvasContextName] = canvasContext;
                    }




                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex, oldIndex, _currQuestion) {
                        if (angular.isUndefined(scope.d.drawMode)) {
                            scope.d.drawMode = DRAWING_MODES.VIEW;
                        }

                        currQuestion = _currQuestion;

                        if (serverDrawingUpdater) {
                            serverDrawingUpdater.flush();
                        }

                        _reloadCanvas(); // re-registers fb listeners to reflect new question
                    });

                    _init();

                    // publish addCanvasToElement function to make it callable from znkExerciseDrawContainer directive
                    ZnkExerciseDrawSrv.addCanvasToElement = addCanvasToElement;
                }
            };
        });
})(angular);
