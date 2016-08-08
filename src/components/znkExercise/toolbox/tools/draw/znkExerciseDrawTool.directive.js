/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseDrawTool',
        function (ZnkExerciseEvents, InfraConfigSrv, UserProfileService, $q) {
            'ngInject';

            function getOffset(el) {
                el = el.getBoundingClientRect();
                return {
                    left: el.left + window.scrollX,
                    top: el.top + window.scrollY
                };
            }

            return {
                templateUrl: 'components/znkExercise/toolbox/tools/draw/znkExerciseDrawToolDirective.template.html',
                require: '^znkExerciseToolBox',
                scope: {
                    znkExerciseElementGetter: '&znkExerciseElement'
                },
                link: function (scope, element, attrs, toolBoxCtrl) {
                    var canvasDomElement,
                        canvasContext,
                        drawingRef,
                        exerciseDrawingRef,
                        offset;

                    var pixSize = 1, lastPoint = null, currentColor = "000";

                    InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                        drawingRef = globalStorage.adapter.getRef('exerciseDrawings');
                    });

                    function _init(){
                        var znkExerciseElement = toolBoxCtrl.getZnkExerciseElement();
                        var canvasContainerElement = angular.element('<div class="draw-tool-container"><canvas width="1000" height="200"></canvas></div>');
                        canvasDomElement = canvasContainerElement.children()[0];
                        canvasContext = canvasDomElement.getContext("2d");
                        znkExerciseElement.append(canvasContainerElement);
                    }

                    function _draw(e) {
                        // Bresenham's line algorithm. We use this to ensure smooth lines are drawn
                        var x1 = Math.floor((e.pageX - offset.left) / pixSize - 1),
                            y1 = Math.floor((e.pageY - offset.top) / pixSize - 1);
                        var x0 = (lastPoint == null) ? x1 : lastPoint[0];
                        var y0 = (lastPoint == null) ? y1 : lastPoint[1];
                        var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
                        var sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1, err = dx - dy;
                        while (true) {
                            //write the pixel into Firebase, or if we are drawing white, remove the pixel
                            exerciseDrawingRef.child(x0 + ":" + y0).set(currentColor === "fff" ? null : currentColor);

                            if (x0 === x1 && y0 === y1) {
                                break;
                            }

                            var e2 = 2 * err;
                            if (e2 > -dy) {
                                err = err - dy;
                                x0 = x0 + sx;
                            }
                            if (e2 < dx) {
                                err = err + dx;
                                y0 = y0 + sy;
                            }
                        }
                        lastPoint = [x1, y1];
                    }

                    function _mousemoveCb(evt) {
                        _draw(evt);
                    }

                    function _startPainting() {
                        lastPoint = null;
                        canvasDomElement.addEventListener('mousemove', _mousemoveCb);
                    }

                    function _stopPainting() {
                        canvasDomElement.removeEventListener('mousemove', _mousemoveCb);
                    }

                    function _mousedownCb(evt) {
                        //left mouse
                        if (evt.which === 1) {
                            _startPainting();
                            canvasDomElement.addEventListener('mouseup', _mouseupCb);
                        }
                    }

                    function _mouseupCb(evt) {
                        //left mouse
                        if (evt.which === 1) {
                            _stopPainting();
                            canvasDomElement.removeEventListener('mouseup', _mouseupCb);
                        }
                    }

                    // Add callbacks that are fired any time the pixel data changes and adjusts the canvas appropriately.
                    // Note that child_added events will be fired for initial pixel data as well.
                    function _drawPixel(snapshot) {
                        if (!canvasContext) {
                            return;
                        }

                        var coords = snapshot.key().split(":");
                        canvasContext.beginPath();
                        canvasContext.fillStyle = 'blue';
                        canvasContext.arc(parseInt(coords[0]), parseInt(coords[1]), pixSize, 0, 2 * Math.PI);
                        canvasContext.fill();
                        canvasContext.closePath();
                        // canvasContext.fillStyle = "#" + snapshot.val();
                        //
                        // canvasContext.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
                    }

                    function _clearPixel(snapshot){
                        if (!canvasContext) {
                            return;
                        }

                        var coords = snapshot.key().split(":");
                        canvasContext.clearRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
                    }

                    function _registerEvents() {
                        canvasDomElement.addEventListener('mousedown', _mousedownCb);
                        exerciseDrawingRef.on("child_added", _drawPixel);
                        exerciseDrawingRef.on("child_changed", _drawPixel);
                        exerciseDrawingRef.on("child_removed", _clearPixel);
                    }

                    function _unregisterEvents() {
                        canvasDomElement.removeEventListener('mousedown', _mousedownCb);
                        canvasDomElement.removeEventListener('mouseup', _mouseupCb);
                        canvasDomElement.removeEventListener('mousemove', _mousemoveCb);
                        if(exerciseDrawingRef){
                            exerciseDrawingRef.off("child_added", _drawPixel);
                            exerciseDrawingRef.off("child_changed", _drawPixel);
                            exerciseDrawingRef.off("child_removed", _clearPixel);
                        }
                    }

                    function _resetCanvas() {
                        debugger;
                        canvasContext.clearRect(0, 0, canvasDomElement.width, canvasDomElement.height);
                        _unregisterEvents();
                    }

                    function _activateTool() {
                        var dataPromMap = {};
                        dataPromMap.currQuestion = toolBoxCtrl.getCurrentQuestion();
                        dataPromMap.currUid = UserProfileService.getCurrUserId();
                        $q.all(dataPromMap).then(function (data) {
                            _resetCanvas();

                            offset = getOffset(canvasDomElement);

                            var exercisePath = data.currUid + '/' + data.currQuestion.id;
                            exerciseDrawingRef = drawingRef.child(exercisePath);

                            _registerEvents();
                        });
                    }

                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function () {
                        _activateTool();
                    });

                    scope.$on('$destroy', function () {
                        _unregisterEvents();
                    });

                    _init();
                }
            };
        });
})(angular);

