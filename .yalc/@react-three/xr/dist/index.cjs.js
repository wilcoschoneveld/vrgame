'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('@babel/runtime/helpers/extends'));
var XRControllerModelFactory = require('three/examples/jsm/webxr/XRControllerModelFactory');
var React = require('react');
var React__default = _interopDefault(React);
var fiber = require('@react-three/fiber');
var ARButton = require('three/examples/jsm/webxr/ARButton');
var VRButton = require('three/examples/jsm/webxr/VRButton');
var three = require('three');
var mergeRefs = _interopDefault(require('react-merge-refs'));
var XRHandModelFactory = require('three/examples/jsm/webxr/XRHandModelFactory');

var XRController = {
  make: function make(id, gl, onConnected, onDisconnected) {
    var controller = gl.xr.getController(id);
    var grip = gl.xr.getControllerGrip(id);
    var xrController = {
      inputSource: undefined,
      grip: grip,
      controller: controller
    };
    grip.userData.name = 'grip';
    controller.userData.name = 'controller';
    controller.addEventListener('connected', function (event) {
      if (event.fake) {
        return;
      }

      xrController.inputSource = event.data;
      onConnected(xrController);
    });
    controller.addEventListener('disconnected', function (_) {
      onDisconnected(xrController);
    });
  }
};

/**
 * Store data associated with some objects in the scene
 *
 * For example storing event handlers:
 *
 * objectA:
 *   onClick: [handler, handler]
 * objectB:
 *   onHover: [handler]
 *   onBlur:  [handler]
 *
 */
var ObjectsState = {
  make: function make() {
    return new Map();
  },
  add: function add(state, object, key, value) {
    if (!state.has(object)) {
      state.set(object, {
        key: [value]
      });
    }

    var entry = state.get(object);

    if (!entry[key]) {
      entry[key] = [];
    }

    entry[key].push(value);
  },
  "delete": function _delete(state, object, key, value) {
    var entry = state.get(object);
    if (!entry || !entry[key]) return;
    entry[key] = entry[key].filter(function (it) {
      return it !== value;
    });

    if (entry[key].length === 0) {
      delete entry[key];
    } // Remove entry if nothing left


    if (Object.keys(entry).length === 0) {
      state["delete"](object);
    }
  },
  has: function has(state, object, key) {
    var entry = state.get(object);
    return !!(entry && entry[key]);
  },
  get: function get(state, object, key) {
    var entry = state.get(object);
    return entry && entry[key];
  }
};

var useXREvent = function useXREvent(event, handler, _temp) {
  var _ref = _temp === void 0 ? {} : _temp,
      handedness = _ref.handedness;

  var handlerRef = React__default.useRef(handler);
  React__default.useEffect(function () {
    handlerRef.current = handler;
  }, [handler]);

  var _useXR = useXR(),
      allControllers = _useXR.controllers;

  React__default.useEffect(function () {
    var controllers = handedness ? allControllers.filter(function (it) {
      return it.inputSource.handedness === handedness;
    }) : allControllers;
    var cleanups = [];
    controllers.forEach(function (it) {
      var listener = function listener(e) {
        return handlerRef.current({
          originalEvent: e,
          controller: it
        });
      };

      it.controller.addEventListener(event, listener);
      cleanups.push(function () {
        return it.controller.removeEventListener(event, listener);
      });
    });
    return function () {
      return cleanups.forEach(function (fn) {
        return fn();
      });
    };
  }, [event, allControllers, handedness]);
};

function _createForOfIteratorHelperLoose(o) { var i = 0; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (o = _unsupportedIterableToArray(o))) return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } i = o[Symbol.iterator](); return i.next.bind(i); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
var InteractionsContext = React__default.createContext({});
function InteractionManager(_ref) {
  var children = _ref.children;

  var _useXR = useXR(),
      controllers = _useXR.controllers;

  var _React$useState = React__default.useState(function () {
    return {
      left: new Map(),
      right: new Map(),
      none: new Map()
    };
  }),
      hoverState = _React$useState[0];

  var _React$useState2 = React__default.useState(function () {
    return ObjectsState.make();
  }),
      interactions = _React$useState2[0];

  var addInteraction = React__default.useCallback(function (object, eventType, handler) {
    ObjectsState.add(interactions, object, eventType, handler);
  }, [interactions]);
  var removeInteraction = React__default.useCallback(function (object, eventType, handler) {
    ObjectsState["delete"](interactions, object, eventType, handler);
  }, [interactions]);

  var _React$useState3 = React__default.useState(function () {
    return new three.Raycaster();
  }),
      raycaster = _React$useState3[0];

  var intersect = React__default.useCallback(function (controller) {
    var objects = Array.from(interactions.keys());
    var tempMatrix = new three.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObjects(objects, true);
  }, [interactions, raycaster]); // Trigger hover and blur events

  fiber.useFrame(function () {
    if (interactions.size === 0) {
      return;
    }

    controllers.forEach(function (it) {
      var controller = it.controller;
      var handedness = it.inputSource.handedness;
      var hovering = hoverState[handedness];
      var hits = new Set();
      var intersections = intersect(controller);
      intersections.forEach(function (intersection) {
        var eventObject = intersection.object;

        while (eventObject) {
          if (ObjectsState.has(interactions, eventObject, 'onHover') && !hovering.has(eventObject)) {
            var _ObjectsState$get;

            (_ObjectsState$get = ObjectsState.get(interactions, eventObject, 'onHover')) == null ? void 0 : _ObjectsState$get.forEach(function (handler) {
              return handler({
                controller: it,
                intersection: intersection
              });
            });
          }

          hovering.set(eventObject, intersection);
          hits.add(eventObject.id);
          eventObject = eventObject.parent;
        }
      }); // Trigger blur on all the object that were hovered in the previous frame
      // but missed in this one

      for (var _iterator = _createForOfIteratorHelperLoose(hovering.keys()), _step; !(_step = _iterator()).done;) {
        var eventObject = _step.value;

        if (!hits.has(eventObject.id)) {
          var _ObjectsState$get2;

          (_ObjectsState$get2 = ObjectsState.get(interactions, eventObject, 'onBlur')) == null ? void 0 : _ObjectsState$get2.forEach(function (handler) {
            return handler({
              controller: it
            });
          });
          hovering["delete"](eventObject);
        }
      }
    });
  });

  var triggerEvent = function triggerEvent(interaction) {
    return function (e) {
      var hovering = hoverState[e.controller.inputSource.handedness];

      for (var _iterator2 = _createForOfIteratorHelperLoose(hovering.keys()), _step2; !(_step2 = _iterator2()).done;) {
        var _ObjectsState$get3;

        var hovered = _step2.value;
        (_ObjectsState$get3 = ObjectsState.get(interactions, hovered, interaction)) == null ? void 0 : _ObjectsState$get3.forEach(function (handler) {
          return handler({
            controller: e.controller
          });
        });
      }
    };
  };

  useXREvent('select', triggerEvent('onSelect'));
  useXREvent('selectstart', triggerEvent('onSelectStart'));
  useXREvent('selectend', triggerEvent('onSelectEnd'));
  useXREvent('squeeze', triggerEvent('onSqueeze'));
  useXREvent('squeezeend', triggerEvent('onSqueezeEnd'));
  useXREvent('squeezestart', triggerEvent('onSqueezeStart'));
  var contextValue = React.useMemo(function () {
    return {
      addInteraction: addInteraction,
      removeInteraction: removeInteraction,
      hoverState: hoverState
    };
  }, [addInteraction, removeInteraction, hoverState]);
  return /*#__PURE__*/React__default.createElement(InteractionsContext.Provider, {
    value: contextValue
  }, children);
}
var useInteraction = function useInteraction(ref, type, handler) {
  var _useContext = React.useContext(InteractionsContext),
      addInteraction = _useContext.addInteraction,
      removeInteraction = _useContext.removeInteraction;

  var isPresent = handler !== undefined;
  var handlerRef = React.useRef(handler);
  React.useEffect(function () {
    handlerRef.current = handler;
  }, [handler]);
  React.useEffect(function () {
    if (!isPresent) return;

    var handlerFn = function handlerFn(e) {
      // @ts-ignore
      handlerRef.current(e);
    };

    addInteraction(ref.current, type, handlerFn);
    var maybeRef = ref.current;
    return function () {
      return removeInteraction(maybeRef, type, handlerFn);
    };
  }, [type, addInteraction, removeInteraction, isPresent, ref]);
};
var Interactive = React.forwardRef(function (props, passedRef) {
  var ref = React.useRef();
  useInteraction(ref, 'onHover', props.onHover);
  useInteraction(ref, 'onBlur', props.onBlur);
  useInteraction(ref, 'onSelectStart', props.onSelectStart);
  useInteraction(ref, 'onSelectEnd', props.onSelectEnd);
  useInteraction(ref, 'onSelect', props.onSelect);
  useInteraction(ref, 'onSqueezeStart', props.onSqueezeStart);
  useInteraction(ref, 'onSqueezeEnd', props.onSqueezeEnd);
  useInteraction(ref, 'onSqueeze', props.onSqueeze);
  return /*#__PURE__*/React__default.createElement("group", {
    ref: mergeRefs([passedRef, ref])
  }, props.children);
});
function RayGrab(_ref2) {
  var children = _ref2.children;
  var grabbingController = React.useRef();
  var groupRef = React.useRef();
  var previousTransform = React.useRef(undefined);
  useXREvent('selectend', function (e) {
    if (e.controller.controller === grabbingController.current) {
      grabbingController.current = undefined;
      previousTransform.current = undefined;
    }
  });
  fiber.useFrame(function () {
    if (!grabbingController.current || !previousTransform.current || !groupRef.current) {
      return;
    }

    var controller = grabbingController.current;
    var group = groupRef.current;
    group.applyMatrix4(previousTransform.current);
    group.applyMatrix4(controller.matrixWorld);
    group.updateWorldMatrix(false, true);
    previousTransform.current = controller.matrixWorld.clone().invert();
  });
  return /*#__PURE__*/React__default.createElement(Interactive, {
    ref: groupRef,
    onSelectStart: function onSelectStart(e) {
      grabbingController.current = e.controller.controller;
      previousTransform.current = e.controller.controller.matrixWorld.clone().invert();
    }
  }, children);
}

var XRContext = React.createContext({});

var useControllers = function useControllers(group) {
  var _useThree = fiber.useThree(),
      gl = _useThree.gl;

  var _React$useState = React.useState([]),
      controllers = _React$useState[0],
      setControllers = _React$useState[1];

  React.useEffect(function () {
    var ids = [0, 1];
    ids.forEach(function (id) {
      XRController.make(id, gl, function (controller) {
        group.add(controller.controller);
        group.add(controller.grip);
        setControllers(function (it) {
          return [].concat(it, [controller]);
        });
      }, function (controller) {
        group.remove(controller.controller);
        group.remove(controller.grip);
        setControllers(function (existing) {
          return existing.filter(function (it) {
            return it !== controller;
          });
        });
      });
    });
  }, [gl, group]);
  return controllers;
};

function useHitTest(hitTestCallback) {
  var _useThree2 = fiber.useThree(),
      gl = _useThree2.gl;

  var hitTestSource = React.useRef();
  var hitTestSourceRequested = React.useRef(false);

  var _React$useState2 = React.useState(function () {
    return new three.Matrix4();
  }),
      hitMatrix = _React$useState2[0];

  fiber.useFrame(function () {
    if (!gl.xr.isPresenting) return;
    var session = gl.xr.getSession();
    if (!session) return;

    if (!hitTestSourceRequested.current) {
      session.requestReferenceSpace('viewer').then(function (referenceSpace) {
        session.requestHitTestSource({
          space: referenceSpace
        }).then(function (source) {
          hitTestSource.current = source;
        });
      });
      session.addEventListener('end', function () {
        hitTestSourceRequested.current = false;
        hitTestSource.current = undefined;
      }, {
        once: true
      });
      hitTestSourceRequested.current = true;
    }

    if (hitTestSource.current && gl.xr.isPresenting) {
      var referenceSpace = gl.xr.getReferenceSpace();

      if (referenceSpace) {
        // This raf is unnecesary, we should get XRFrame from r3f but it's not implemented yet
        session.requestAnimationFrame(function (time, frame) {
          var hitTestResults = frame.getHitTestResults(hitTestSource.current);

          if (hitTestResults.length) {
            var _hit = hitTestResults[0];

            var pose = _hit.getPose(referenceSpace);

            if (pose) {
              hitMatrix.fromArray(pose.transform.matrix);
              hitTestCallback(hitMatrix, _hit);
            }
          }
        });
      }
    }
  });
}
function startXRloop(gl) {
  gl.xr.enabled = true;
  gl.setAnimationLoop(function (timestamp) {
    return fiber.advance(timestamp, true);
  });
}
function XR(_ref) {
  var children = _ref.children,
      buttonVR = _ref.buttonVR,
      buttonAR = _ref.buttonAR,
      sessionInit = _ref.sessionInit;

  var _useThree3 = fiber.useThree(),
      gl = _useThree3.gl,
      camera = _useThree3.camera;

  var _React$useState3 = React.useState(function () {
    return gl.xr.isPresenting;
  }),
      isPresenting = _React$useState3[0],
      setIsPresenting = _React$useState3[1];

  var _React$useState4 = React.useState(function () {
    return new three.Group();
  }),
      player = _React$useState4[0];

  var controllers = useControllers(player);
  React.useEffect(function () {
    var xr = gl.xr;

    var handleSessionChange = function handleSessionChange() {
      return setIsPresenting(xr.isPresenting);
    };

    xr.addEventListener('sessionstart', handleSessionChange);
    xr.addEventListener('sessionend', handleSessionChange);
    return function () {
      xr.removeEventListener('sessionstart', handleSessionChange);
      xr.removeEventListener('sessionend', handleSessionChange);
    };
  }, [gl]);
  React.useEffect(function () {
    if (buttonVR) {
      var child = document.body.appendChild(VRButton.VRButton.createButton(gl));
      return function () {
        document.body.removeChild(child);
      };
    }
  }, [gl, buttonVR]);
  React.useEffect(function () {
    if (buttonAR) {
      var child = document.body.appendChild(ARButton.ARButton.createButton(gl, sessionInit));
      return function () {
        document.body.removeChild(child);
      };
    }
  }, [gl, buttonAR, sessionInit]);
  var value = React.useMemo(function () {
    return {
      controllers: controllers,
      isPresenting: isPresenting,
      player: player
    };
  }, [controllers, isPresenting, player]);
  return /*#__PURE__*/React.createElement(XRContext.Provider, {
    value: value
  }, /*#__PURE__*/React.createElement("primitive", {
    object: player,
    dispose: null
  }, /*#__PURE__*/React.createElement("primitive", {
    object: camera,
    dispose: null
  })), /*#__PURE__*/React.createElement(InteractionManager, null, children));
}
var useXR = function useXR() {
  var xrValue = React.useContext(XRContext);
  var interactionsValue = React.useContext(InteractionsContext);
  var contextValue = React.useMemo(function () {
    return _extends(_extends({}, xrValue), interactionsValue);
  }, [xrValue, interactionsValue]);
  return contextValue;
};
var useXRFrame = function useXRFrame(callback) {
  var _useThree4 = fiber.useThree(),
      gl = _useThree4.gl;

  var requestRef = React.useRef();
  var previousTimeRef = React.useRef();
  var loop = React.useCallback(function (time, xrFrame) {
    if (previousTimeRef.current !== undefined) {
      callback(time, xrFrame);
    }

    previousTimeRef.current = time;
    requestRef.current = gl.xr.getSession().requestAnimationFrame(loop);
  }, [gl.xr, callback]);
  React.useEffect(function () {
    var _gl$xr;

    if (!((_gl$xr = gl.xr) == null ? void 0 : _gl$xr.isPresenting)) {
      return;
    }

    requestRef.current = gl.xr.getSession().requestAnimationFrame(loop);
    return function () {
      if (requestRef.current) {
        gl.xr.getSession().cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gl.xr.isPresenting, loop]);
};
var useController = function useController(handedness) {
  var _useXR = useXR(),
      controllers = _useXR.controllers;

  var controller = React.useMemo(function () {
    return controllers.find(function (it) {
      return it.inputSource.handedness === handedness;
    });
  }, [handedness, controllers]);
  return controller;
};

var modelFactory = new XRControllerModelFactory.XRControllerModelFactory();
var modelCache = new WeakMap();
function DefaultXRControllers(_ref) {
  var _ref$rayMaterial = _ref.rayMaterial,
      rayMaterial = _ref$rayMaterial === void 0 ? {} : _ref$rayMaterial;

  var _useThree = fiber.useThree(),
      scene = _useThree.scene;

  var _useXR = useXR(),
      controllers = _useXR.controllers,
      hoverState = _useXR.hoverState;

  var _React$useState = React__default.useState(new Map()),
      rays = _React$useState[0]; // Show ray line when hovering objects


  fiber.useFrame(function () {
    controllers.forEach(function (it) {
      var ray = rays.get(it.controller.id);
      if (!ray) return;
      var intersection = hoverState[it.inputSource.handedness].values().next().value;

      if (!intersection || it.inputSource.handedness === 'none') {
        ray.visible = false;
        return;
      }

      var rayLength = intersection.distance; // Tiny offset to clip ray on AR devices
      // that don't have handedness set to 'none'

      var offset = -0.01;
      ray.visible = true;
      ray.scale.y = rayLength + offset;
      ray.position.z = -rayLength / 2 - offset;
    });
  });
  React.useEffect(function () {
    var cleanups = [];
    controllers.forEach(function (_ref2) {
      var controller = _ref2.controller,
          grip = _ref2.grip,
          inputSource = _ref2.inputSource;
      // Attach 3D model of the controller
      var model;

      if (modelCache.has(controller)) {
        model = modelCache.get(controller);
      } else {
        model = modelFactory.createControllerModel(controller);
        controller.dispatchEvent({
          type: 'connected',
          data: inputSource,
          fake: true
        });
        modelCache.set(controller, model);
      }

      grip.add(model); // Add Ray line (used for hovering)

      var ray = new three.Mesh();
      ray.rotation.set(Math.PI / 2, 0, 0);
      ray.material = new three.MeshBasicMaterial(_extends({
        color: new three.Color(0xffffff),
        opacity: 0.8,
        transparent: true
      }, rayMaterial));
      ray.geometry = new three.BoxBufferGeometry(0.002, 1, 0.002);
      rays.set(controller.id, ray);
      controller.add(ray);
      cleanups.push(function () {
        grip.remove(model);
        controller.remove(ray);
        rays["delete"](controller.id);
      });
    });
    return function () {
      cleanups.forEach(function (fn) {
        return fn();
      });
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controllers, scene, rays, JSON.stringify(rayMaterial)]);
  return null;
}

function Hands(_ref) {
  var _ref$profile = _ref.profile,
      profile = _ref$profile === void 0 ? 'oculus' : _ref$profile;

  var _useThree = fiber.useThree(),
      scene = _useThree.scene,
      gl = _useThree.gl;

  React.useEffect(function () {
    var handFactory = new XRHandModelFactory.XRHandModelFactory().setPath('https://threejs.org/examples/models/fbx/');
    var options = profile === 'oculus_lowpoly' ? {
      model: 'lowpoly'
    } : undefined;
    var threeProfile = profile === 'oculus_lowpoly' ? 'oculus' : profile; // @ts-ignore

    var hand1 = gl.xr.getHand(0);
    scene.add(hand1);
    hand1.add(handFactory.createHandModel(hand1, threeProfile, options)); // @ts-ignore

    var hand2 = gl.xr.getHand(1);
    scene.add(hand2);
    hand2.add(handFactory.createHandModel(hand2, threeProfile, options));
  }, [scene, gl]);
  return null;
}

exports.DefaultXRControllers = DefaultXRControllers;
exports.Hands = Hands;
exports.InteractionManager = InteractionManager;
exports.InteractionsContext = InteractionsContext;
exports.Interactive = Interactive;
exports.RayGrab = RayGrab;
exports.XR = XR;
exports.XRController = XRController;
exports.startXRloop = startXRloop;
exports.useController = useController;
exports.useHitTest = useHitTest;
exports.useInteraction = useInteraction;
exports.useXR = useXR;
exports.useXREvent = useXREvent;
exports.useXRFrame = useXRFrame;
