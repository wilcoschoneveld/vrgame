import _extends from '@babel/runtime/helpers/esm/extends';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';
import React__default, { useMemo, useContext, useRef, useEffect, forwardRef, createContext, useState, createElement, useCallback } from 'react';
import { useFrame, useThree, advance } from '@react-three/fiber';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';
import { Raycaster, Matrix4, Group, Mesh, MeshBasicMaterial, Color, BoxBufferGeometry } from 'three';
import mergeRefs from 'react-merge-refs';
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory';

const XRController = {
  make: (id, gl, onConnected, onDisconnected) => {
    const controller = gl.xr.getController(id);
    const grip = gl.xr.getControllerGrip(id);
    const xrController = {
      inputSource: undefined,
      grip,
      controller
    };
    grip.userData.name = 'grip';
    controller.userData.name = 'controller';
    controller.addEventListener('connected', event => {
      if (event.fake) {
        return;
      }

      xrController.inputSource = event.data;
      onConnected(xrController);
    });
    controller.addEventListener('disconnected', _ => {
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
const ObjectsState = {
  make: function make() {
    return new Map();
  },
  add: function add(state, object, key, value) {
    if (!state.has(object)) {
      state.set(object, {
        key: [value]
      });
    }

    const entry = state.get(object);

    if (!entry[key]) {
      entry[key] = [];
    }

    entry[key].push(value);
  },
  delete: function _delete(state, object, key, value) {
    const entry = state.get(object);
    if (!entry || !entry[key]) return;
    entry[key] = entry[key].filter(it => it !== value);

    if (entry[key].length === 0) {
      delete entry[key];
    } // Remove entry if nothing left


    if (Object.keys(entry).length === 0) {
      state.delete(object);
    }
  },
  has: function has(state, object, key) {
    const entry = state.get(object);
    return !!(entry && entry[key]);
  },
  get: function get(state, object, key) {
    const entry = state.get(object);
    return entry && entry[key];
  }
};

const useXREvent = (event, handler, {
  handedness
} = {}) => {
  const handlerRef = React__default.useRef(handler);
  React__default.useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  const {
    controllers: allControllers
  } = useXR();
  React__default.useEffect(() => {
    const controllers = handedness ? allControllers.filter(it => it.inputSource.handedness === handedness) : allControllers;
    const cleanups = [];
    controllers.forEach(it => {
      const listener = e => handlerRef.current({
        originalEvent: e,
        controller: it
      });

      it.controller.addEventListener(event, listener);
      cleanups.push(() => it.controller.removeEventListener(event, listener));
    });
    return () => cleanups.forEach(fn => fn());
  }, [event, allControllers, handedness]);
};

const InteractionsContext = React__default.createContext({});
function InteractionManager({
  children
}) {
  const {
    controllers
  } = useXR();
  const [hoverState] = React__default.useState(() => ({
    left: new Map(),
    right: new Map(),
    none: new Map()
  }));
  const [interactions] = React__default.useState(() => ObjectsState.make());
  const addInteraction = React__default.useCallback((object, eventType, handler) => {
    ObjectsState.add(interactions, object, eventType, handler);
  }, [interactions]);
  const removeInteraction = React__default.useCallback((object, eventType, handler) => {
    ObjectsState.delete(interactions, object, eventType, handler);
  }, [interactions]);
  const [raycaster] = React__default.useState(() => new Raycaster());
  const intersect = React__default.useCallback(controller => {
    const objects = Array.from(interactions.keys());
    const tempMatrix = new Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObjects(objects, true);
  }, [interactions, raycaster]); // Trigger hover and blur events

  useFrame(() => {
    if (interactions.size === 0) {
      return;
    }

    controllers.forEach(it => {
      const {
        controller
      } = it;
      const handedness = it.inputSource.handedness;
      const hovering = hoverState[handedness];
      const hits = new Set();
      const intersections = intersect(controller);
      intersections.forEach(intersection => {
        let eventObject = intersection.object;

        while (eventObject) {
          if (ObjectsState.has(interactions, eventObject, 'onHover') && !hovering.has(eventObject)) {
            var _ObjectsState$get;

            (_ObjectsState$get = ObjectsState.get(interactions, eventObject, 'onHover')) == null ? void 0 : _ObjectsState$get.forEach(handler => handler({
              controller: it,
              intersection
            }));
          }

          hovering.set(eventObject, intersection);
          hits.add(eventObject.id);
          eventObject = eventObject.parent;
        }
      }); // Trigger blur on all the object that were hovered in the previous frame
      // but missed in this one

      for (const eventObject of hovering.keys()) {
        if (!hits.has(eventObject.id)) {
          var _ObjectsState$get2;

          (_ObjectsState$get2 = ObjectsState.get(interactions, eventObject, 'onBlur')) == null ? void 0 : _ObjectsState$get2.forEach(handler => handler({
            controller: it
          }));
          hovering.delete(eventObject);
        }
      }
    });
  });

  const triggerEvent = interaction => e => {
    const hovering = hoverState[e.controller.inputSource.handedness];

    for (const hovered of hovering.keys()) {
      var _ObjectsState$get3;

      (_ObjectsState$get3 = ObjectsState.get(interactions, hovered, interaction)) == null ? void 0 : _ObjectsState$get3.forEach(handler => handler({
        controller: e.controller
      }));
    }
  };

  useXREvent('select', triggerEvent('onSelect'));
  useXREvent('selectstart', triggerEvent('onSelectStart'));
  useXREvent('selectend', triggerEvent('onSelectEnd'));
  useXREvent('squeeze', triggerEvent('onSqueeze'));
  useXREvent('squeezeend', triggerEvent('onSqueezeEnd'));
  useXREvent('squeezestart', triggerEvent('onSqueezeStart'));
  const contextValue = useMemo(() => ({
    addInteraction,
    removeInteraction,
    hoverState
  }), [addInteraction, removeInteraction, hoverState]);
  return /*#__PURE__*/React__default.createElement(InteractionsContext.Provider, {
    value: contextValue
  }, children);
}
const useInteraction = (ref, type, handler) => {
  const {
    addInteraction,
    removeInteraction
  } = useContext(InteractionsContext);
  const isPresent = handler !== undefined;
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  useEffect(() => {
    if (!isPresent) return;

    const handlerFn = e => {
      // @ts-ignore
      handlerRef.current(e);
    };

    addInteraction(ref.current, type, handlerFn);
    const maybeRef = ref.current;
    return () => removeInteraction(maybeRef, type, handlerFn);
  }, [type, addInteraction, removeInteraction, isPresent, ref]);
};
const Interactive = forwardRef((props, passedRef) => {
  const ref = useRef();
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
function RayGrab({
  children
}) {
  const grabbingController = useRef();
  const groupRef = useRef();
  const previousTransform = useRef(undefined);
  useXREvent('selectend', e => {
    if (e.controller.controller === grabbingController.current) {
      grabbingController.current = undefined;
      previousTransform.current = undefined;
    }
  });
  useFrame(() => {
    if (!grabbingController.current || !previousTransform.current || !groupRef.current) {
      return;
    }

    const controller = grabbingController.current;
    const group = groupRef.current;
    group.applyMatrix4(previousTransform.current);
    group.applyMatrix4(controller.matrixWorld);
    group.updateWorldMatrix(false, true);
    previousTransform.current = controller.matrixWorld.clone().invert();
  });
  return /*#__PURE__*/React__default.createElement(Interactive, {
    ref: groupRef,
    onSelectStart: e => {
      grabbingController.current = e.controller.controller;
      previousTransform.current = e.controller.controller.matrixWorld.clone().invert();
    }
  }, children);
}

const XRContext = createContext({});

const useControllers = group => {
  const {
    gl
  } = useThree();
  const [controllers, setControllers] = useState([]);
  useEffect(() => {
    const ids = [0, 1];
    ids.forEach(id => {
      XRController.make(id, gl, controller => {
        group.add(controller.controller);
        group.add(controller.grip);
        setControllers(it => [...it, controller]);
      }, controller => {
        group.remove(controller.controller);
        group.remove(controller.grip);
        setControllers(existing => existing.filter(it => it !== controller));
      });
    });
  }, [gl, group]);
  return controllers;
};

function useHitTest(hitTestCallback) {
  const {
    gl
  } = useThree();
  const hitTestSource = useRef();
  const hitTestSourceRequested = useRef(false);
  const [hitMatrix] = useState(() => new Matrix4());
  useFrame(() => {
    if (!gl.xr.isPresenting) return;
    const session = gl.xr.getSession();
    if (!session) return;

    if (!hitTestSourceRequested.current) {
      session.requestReferenceSpace('viewer').then(referenceSpace => {
        session.requestHitTestSource({
          space: referenceSpace
        }).then(source => {
          hitTestSource.current = source;
        });
      });
      session.addEventListener('end', () => {
        hitTestSourceRequested.current = false;
        hitTestSource.current = undefined;
      }, {
        once: true
      });
      hitTestSourceRequested.current = true;
    }

    if (hitTestSource.current && gl.xr.isPresenting) {
      const referenceSpace = gl.xr.getReferenceSpace();

      if (referenceSpace) {
        // This raf is unnecesary, we should get XRFrame from r3f but it's not implemented yet
        session.requestAnimationFrame((time, frame) => {
          const hitTestResults = frame.getHitTestResults(hitTestSource.current);

          if (hitTestResults.length) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);

            if (pose) {
              hitMatrix.fromArray(pose.transform.matrix);
              hitTestCallback(hitMatrix, hit);
            }
          }
        });
      }
    }
  });
}
function startXRloop(gl) {
  gl.xr.enabled = true;
  gl.setAnimationLoop(timestamp => advance(timestamp, true));
}
function XR({
  children,
  buttonVR,
  buttonAR,
  sessionInit
}) {
  const {
    gl,
    camera
  } = useThree();
  const [isPresenting, setIsPresenting] = useState(() => gl.xr.isPresenting);
  const [player] = useState(() => new Group());
  const controllers = useControllers(player);
  useEffect(() => {
    const xr = gl.xr;

    const handleSessionChange = () => setIsPresenting(xr.isPresenting);

    xr.addEventListener('sessionstart', handleSessionChange);
    xr.addEventListener('sessionend', handleSessionChange);
    return () => {
      xr.removeEventListener('sessionstart', handleSessionChange);
      xr.removeEventListener('sessionend', handleSessionChange);
    };
  }, [gl]);
  useEffect(() => {
    if (buttonVR) {
      const child = document.body.appendChild(VRButton.createButton(gl));
      return () => {
        document.body.removeChild(child);
      };
    }
  }, [gl, buttonVR]);
  useEffect(() => {
    if (buttonAR) {
      const child = document.body.appendChild(ARButton.createButton(gl, sessionInit));
      return () => {
        document.body.removeChild(child);
      };
    }
  }, [gl, buttonAR, sessionInit]);
  const value = useMemo(() => ({
    controllers,
    isPresenting,
    player
  }), [controllers, isPresenting, player]);
  return /*#__PURE__*/createElement(XRContext.Provider, {
    value: value
  }, /*#__PURE__*/createElement("primitive", {
    object: player,
    dispose: null
  }, /*#__PURE__*/createElement("primitive", {
    object: camera,
    dispose: null
  })), /*#__PURE__*/createElement(InteractionManager, null, children));
}
const useXR = () => {
  const xrValue = useContext(XRContext);
  const interactionsValue = useContext(InteractionsContext);
  const contextValue = useMemo(() => _extends(_extends({}, xrValue), interactionsValue), [xrValue, interactionsValue]);
  return contextValue;
};
const useXRFrame = callback => {
  const {
    gl
  } = useThree();
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const loop = useCallback((time, xrFrame) => {
    if (previousTimeRef.current !== undefined) {
      callback(time, xrFrame);
    }

    previousTimeRef.current = time;
    requestRef.current = gl.xr.getSession().requestAnimationFrame(loop);
  }, [gl.xr, callback]);
  useEffect(() => {
    var _gl$xr;

    if (!((_gl$xr = gl.xr) == null ? void 0 : _gl$xr.isPresenting)) {
      return;
    }

    requestRef.current = gl.xr.getSession().requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) {
        gl.xr.getSession().cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gl.xr.isPresenting, loop]);
};
const useController = handedness => {
  const {
    controllers
  } = useXR();
  const controller = useMemo(() => controllers.find(it => it.inputSource.handedness === handedness), [handedness, controllers]);
  return controller;
};

const modelFactory = new XRControllerModelFactory();
const modelCache = new WeakMap();
function DefaultXRControllers({
  rayMaterial = {}
}) {
  const {
    scene
  } = useThree();
  const {
    controllers,
    hoverState
  } = useXR();
  const [rays] = React__default.useState(new Map()); // Show ray line when hovering objects

  useFrame(() => {
    controllers.forEach(it => {
      const ray = rays.get(it.controller.id);
      if (!ray) return;
      const intersection = hoverState[it.inputSource.handedness].values().next().value;

      if (!intersection || it.inputSource.handedness === 'none') {
        ray.visible = false;
        return;
      }

      const rayLength = intersection.distance; // Tiny offset to clip ray on AR devices
      // that don't have handedness set to 'none'

      const offset = -0.01;
      ray.visible = true;
      ray.scale.y = rayLength + offset;
      ray.position.z = -rayLength / 2 - offset;
    });
  });
  useEffect(() => {
    const cleanups = [];
    controllers.forEach(({
      controller,
      grip,
      inputSource
    }) => {
      // Attach 3D model of the controller
      let model;

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

      const ray = new Mesh();
      ray.rotation.set(Math.PI / 2, 0, 0);
      ray.material = new MeshBasicMaterial(_extends({
        color: new Color(0xffffff),
        opacity: 0.8,
        transparent: true
      }, rayMaterial));
      ray.geometry = new BoxBufferGeometry(0.002, 1, 0.002);
      rays.set(controller.id, ray);
      controller.add(ray);
      cleanups.push(() => {
        grip.remove(model);
        controller.remove(ray);
        rays.delete(controller.id);
      });
    });
    return () => {
      cleanups.forEach(fn => fn());
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controllers, scene, rays, JSON.stringify(rayMaterial)]);
  return null;
}

function Hands({
  profile = 'oculus'
}) {
  const {
    scene,
    gl
  } = useThree();
  useEffect(() => {
    const handFactory = new XRHandModelFactory().setPath('https://threejs.org/examples/models/fbx/');
    const options = profile === 'oculus_lowpoly' ? {
      model: 'lowpoly'
    } : undefined;
    const threeProfile = profile === 'oculus_lowpoly' ? 'oculus' : profile; // @ts-ignore

    const hand1 = gl.xr.getHand(0);
    scene.add(hand1);
    hand1.add(handFactory.createHandModel(hand1, threeProfile, options)); // @ts-ignore

    const hand2 = gl.xr.getHand(1);
    scene.add(hand2);
    hand2.add(handFactory.createHandModel(hand2, threeProfile, options));
  }, [scene, gl]);
  return null;
}

export { DefaultXRControllers, Hands, InteractionManager, InteractionsContext, Interactive, RayGrab, XR, XRController, startXRloop, useController, useHitTest, useInteraction, useXR, useXREvent, useXRFrame };
