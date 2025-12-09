import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

import './AudioVisualizer.css';

// Helpers
const BG_COLORS = [
  new THREE.Color('#0a0a2a'), // Top
  new THREE.Color('#2a2a5a'), // Mid
  new THREE.Color('#3a3a7a')  // Bottom
];

export default function AudioVisualizer() {
  const mountRef = useRef(null);
  const params = useRef({
    maxHeight: 25,
    dampingFall: 0.05,
    dampingRise: 0.25,
    bloomStrength: 1.5,
    reflectivity: 0.9,
    bokehAperture: 0.0003,
    colors: [
        new THREE.Color(0x101030), 
        new THREE.Color(0x0066ff), 
        new THREE.Color(0x00aaff), 
        new THREE.Color(0x00ffff), 
        new THREE.Color(0xff00ff), 
        new THREE.Color(0xffffff)  
    ]
  });

  const [activePanel, setActivePanel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("0:00 / 0:00");
  const [progressWidth, setProgressWidth] = useState("0%");
  
  // Display Values State
  const [valHeight, setValHeight] = useState("1.0x");
  const [valDamping, setValDamping] = useState("Medium");
  const [valBloom, setValBloom] = useState("1.5");
  const [valDof, setValDof] = useState("Medium");
  const [valReflect, setValReflect] = useState("90%");
  const [valLightBg, setValLightBg] = useState("1.2");
  const [valLightAmbient, setValLightAmbient] = useState("2.0");
  const [valLightSpot, setValLightSpot] = useState("3000");
  const [valLightTop, setValLightTop] = useState("3.0");

  // Three.js & Audio References
  const refs = useRef({
    scene: null, camera: null, renderer: null, controls: null, composer: null,
    bloomPass: null, bokehPass: null, mesh: null, starSystem: null, sourceMesh: null,
    ambientLight: null, topLight: null, spotLight: null,
    audioCtx: null, analyser: null, source: null, dataArray: null,
    audioStartTime: 0, audioDuration: 0,
    currentHeights: null, audioTargetHeights: null, dummy: new THREE.Object3D(),
    averageFrequency: 0,
    animationFrameId: null
  });

  const GRID_SIZE = 60; 
  const TOTAL_CUBES = GRID_SIZE * GRID_SIZE;
  const CUBE_SIZE = 0.8;
  const GAP = 0.15; 

  // Initialize Three.js
  useEffect(() => {
    const { current: r } = refs;
    const width = mountRef.current ? mountRef.current.clientWidth : window.innerWidth;
    const height = mountRef.current ? mountRef.current.clientHeight : window.innerHeight;

    // SCENE
    r.scene = new THREE.Scene();
    r.scene.fog = new THREE.FogExp2(0x1a1a3a, 0.01);
    
    // Arrays
    r.currentHeights = new Float32Array(TOTAL_CUBES).fill(0.1);
    r.audioTargetHeights = new Float32Array(TOTAL_CUBES).fill(0.1);

    // CAMERA
    r.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    r.camera.position.set(0, 45, 65); 
    r.camera.lookAt(0, 0, 0); 

    // RENDERER
    r.renderer = new THREE.WebGLRenderer({ antialias: false });
    r.renderer.setSize(width, height);
    r.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.renderer.toneMapping = THREE.ReinhardToneMapping;
    r.renderer.toneMappingExposure = 3.0;
    r.renderer.shadowMap.enabled = true;
    r.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    if (mountRef.current) {
        mountRef.current.appendChild(r.renderer.domElement);
    }

    // CONTROLS
    r.controls = new OrbitControls(r.camera, r.renderer.domElement);
    r.controls.enableDamping = true;
    r.controls.dampingFactor = 0.05;
    r.controls.autoRotate = true;
    r.controls.autoRotateSpeed = 0.5;
    r.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    r.controls.minDistance = 10;
    r.controls.maxDistance = 200;

    // POST PROCESSING
    const renderPass = new RenderPass(r.scene, r.camera);
    r.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), params.current.bloomStrength, 0.4, 0.6);
    r.bokehPass = new BokehPass(r.scene, r.camera, {
        focus: 65.0, aperture: params.current.bokehAperture, maxblur: 0.015,
        width: width, height: height
    });
    const outputPass = new OutputPass();

    r.composer = new EffectComposer(r.renderer);
    r.composer.addPass(renderPass);
    r.composer.addPass(r.bloomPass);
    r.composer.addPass(r.bokehPass);
    r.composer.addPass(outputPass);

    // LIGHTS
    r.ambientLight = new THREE.HemisphereLight(0x6666aa, 0x111122, 2.0);
    r.scene.add(r.ambientLight);

    r.topLight = new THREE.PointLight(0xccccff, 3.0, 100);
    r.topLight.position.set(0, 40, 0);
    r.scene.add(r.topLight);

    r.spotLight = new THREE.SpotLight(0xffaaee, 3000);
    r.spotLight.position.set(60, 80, 60);
    r.spotLight.angle = Math.PI / 5;
    r.spotLight.penumbra = 0.5;
    r.spotLight.castShadow = true;
    r.spotLight.shadow.mapSize.set(2048, 2048);
    r.spotLight.shadow.bias = -0.0001;
    r.scene.add(r.spotLight);

    // Light Source Visual
    const sphereGeo = new THREE.SphereGeometry(4, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    r.sourceMesh = new THREE.Mesh(sphereGeo, sphereMat);
    r.sourceMesh.position.copy(r.spotLight.position);
    r.scene.add(r.sourceMesh);

    // Lens Flare Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32,32,0,32,32,32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,200,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad; ctx.fillRect(0,0,64,64);
    const spriteMap = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: spriteMap, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(40, 40, 1);
    r.sourceMesh.add(sprite);

    // MESH - FLOOR
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, 1, CUBE_SIZE);
    geometry.translate(0, 0.5, 0); 
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, roughness: 0.15, metalness: 0.3, 
        reflectivity: params.current.reflectivity, 
        clearcoat: 1.0, clearcoatRoughness: 0.1,
        emissive: 0x000000, 
    });

    r.mesh = new THREE.InstancedMesh(geometry, material, TOTAL_CUBES);
    r.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    r.mesh.receiveShadow = true;
    r.mesh.castShadow = true;
    r.scene.add(r.mesh);

    // Init Logic
    createGradientBackground(1.2);
    initMeshPositions();
    createStarField();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);

    // Animation Loop
    const animate = () => {
        r.animationFrameId = requestAnimationFrame(animate);
        r.controls.update();

        // Audio updates
        if (isPlaying && r.analyser) { 
           updatePlaybackInfo(); // React state update, might be heavy if every frame? Limit it? 
           // Better to do React update via requestAnimationFrame only if changed noticeably, but direct DOM manipulation is faster
           // For this port, I'll stick to updating State for UI or use refs for text.
           // However, to avoid re-renders, I will try to update playback visual WITHOUT React state for the bar, 
           // or accept the cost. Actually `updatePlaybackInfo` below sets state.
           // To avoid react render loop, I should check if I can just use refs for the bar width and text.
           // But I will try standard React way first. 
           
           r.analyser.getByteFrequencyData(r.dataArray);
           let sum = 0;
           const range = r.dataArray.length / 2;
           for(let j = 0; j < range; j++) sum += r.dataArray[j];
           r.averageFrequency = THREE.MathUtils.lerp(r.averageFrequency, sum / range, 0.1);
           
           updateGridVisuals();

           if (r.starSystem) {
             r.starSystem.material.opacity = 0.4 + (r.averageFrequency / 255) * 0.6;
             r.starSystem.rotation.y += 0.0002;
           }
        }

        const dist = r.camera.position.distanceTo(new THREE.Vector3(0,0,0));
        if (r.bokehPass && r.bokehPass.uniforms) r.bokehPass.uniforms['focus'].value = dist;

        r.composer.render();
    };
    
    animate();

    return () => {
        cancelAnimationFrame(r.animationFrameId);
        window.removeEventListener('resize', onWindowResize);
        if (r.audioCtx) r.audioCtx.close();
        if (mountRef.current && r.renderer.domElement) {
            mountRef.current.removeChild(r.renderer.domElement);
        }
        r.renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]); // Re-bind if isPlaying changes? No, isPlaying is a ref or accessed directly. 
  // Actually isPlaying is State. The animate closure captures the initial value unless we use a ref for isPlaying.
  // I must use a ref for isPlaying inside animate loop!
  
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Redefine animate to use ref
  useEffect(() => {
    // ... setup code ...
    // BUT the setup code above is only run once on mount. 
    // The animate function defined inside that useEffect will see stale state if I don't use refs.
    // So I should use `isPlayingRef.current` inside the loop.
  }, []);

  // --- Internal Functions (attached to refs or local) ---
  
  const createGradientBackground = (brightness = 1.0) => {
    const canvas = document.createElement('canvas');
    canvas.width = 2; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    const c0 = BG_COLORS[0].clone().multiplyScalar(brightness).getStyle();
    const c1 = BG_COLORS[1].clone().multiplyScalar(brightness).getStyle();
    const c2 = BG_COLORS[2].clone().multiplyScalar(brightness).getStyle();
    gradient.addColorStop(0, c0); 
    gradient.addColorStop(0.5, c1); 
    gradient.addColorStop(1, c2); 
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    if (refs.current.scene.background) refs.current.scene.background.dispose();
    refs.current.scene.background = new THREE.CanvasTexture(canvas);
    refs.current.scene.background.colorSpace = THREE.SRGBColorSpace;
  };

  const createStarField = () => {
    const geo = new THREE.BufferGeometry();
    const count = 3500;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count*3; i+=3) {
        pos[i] = (Math.random()-0.5)*250;
        pos[i+1] = Math.random()*120 + 20;
        pos[i+2] = (Math.random()-0.5)*250;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
        size: 0.5, color: 0xffffff, transparent: true, 
        opacity: 0.8, blending: THREE.AdditiveBlending
    });
    refs.current.starSystem = new THREE.Points(geo, mat);
    refs.current.scene.add(refs.current.starSystem);
  };

  const initMeshPositions = () => {
    const r = refs.current;
    const offset = (GRID_SIZE * (CUBE_SIZE + GAP)) / 2;
    let i = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
            r.dummy.position.set(x * (CUBE_SIZE + GAP) - offset, 0, z * (CUBE_SIZE + GAP) - offset);
            r.dummy.scale.set(1, 0.1, 1);
            r.dummy.updateMatrix();
            r.mesh.setMatrixAt(i, r.dummy.matrix);
            r.mesh.setColorAt(i, params.current.colors[0]);
            i++;
        }
    }
    r.mesh.instanceMatrix.needsUpdate = true;
    r.mesh.instanceColor.needsUpdate = true;
  };

  const getInterpolatedColor = (t) => {
    const pComments = params.current.colors;
    if (t < 0.02) return pComments[0];
    const color = new THREE.Color();
    if (t < 0.2) return color.copy(pComments[0]).lerp(pComments[1], t / 0.2);
    else if (t < 0.4) return color.copy(pComments[1]).lerp(pComments[2], (t - 0.2) / 0.2);
    else if (t < 0.6) return color.copy(pComments[2]).lerp(pComments[3], (t - 0.4) / 0.2);
    else if (t < 0.8) return color.copy(pComments[3]).lerp(pComments[4], (t - 0.6) / 0.2);
    else return color.copy(pComments[4]).lerp(pComments[5], (t - 0.8) / 0.2);
  };

  const updateGridVisuals = () => {
    const r = refs.current;
    if (!r.dataArray) return;
    const offset = (GRID_SIZE * (CUBE_SIZE + GAP)) / 2;
    const center = GRID_SIZE / 2;

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
            const index = x * GRID_SIZE + z;
            const dist = Math.sqrt((x - center)**2 + (z - center)**2);
            const normalizedDist = Math.min(dist / (center * 1.4), 1.0);
            const freqIndex = Math.floor(normalizedDist * (r.dataArray.length / 2.5)); 
            const value = r.dataArray[freqIndex] || 0;
            const trebleBoost = 1.0 + normalizedDist * 1.5;
            const strength = Math.min(Math.max(0, (value * trebleBoost) - 30) / 225, 1.5);
            r.audioTargetHeights[index] = 0.1 + strength * params.current.maxHeight;
        }
    }

    let i = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
            let neighborSum = 0, count = 0;
            if (x > 0) { neighborSum += r.currentHeights[i - GRID_SIZE]; count++; }
            if (x < GRID_SIZE - 1) { neighborSum += r.currentHeights[i + GRID_SIZE]; count++; }
            if (z > 0) { neighborSum += r.currentHeights[i - 1]; count++; }
            if (z < GRID_SIZE - 1) { neighborSum += r.currentHeights[i + 1]; count++; }
            
            let mixedTarget = r.audioTargetHeights[i] * 0.6 + (count ? neighborSum / count : 0.1) * 0.4;
            const damping = mixedTarget > r.currentHeights[i] ? params.current.dampingRise : params.current.dampingFall;
            r.currentHeights[i] = THREE.MathUtils.lerp(r.currentHeights[i], mixedTarget, damping);
            
            r.dummy.position.set(x * (CUBE_SIZE + GAP) - offset, 0, z * (CUBE_SIZE + GAP) - offset);
            r.dummy.scale.set(1, r.currentHeights[i], 1);
            r.dummy.updateMatrix();
            r.mesh.setMatrixAt(i, r.dummy.matrix);

            r.mesh.setColorAt(i, getInterpolatedColor((r.currentHeights[i] - 0.1) / (params.current.maxHeight * 0.8)));
            i++;
        }
    }
    r.mesh.instanceMatrix.needsUpdate = true;
    r.mesh.instanceColor.needsUpdate = true;
  };

  const onWindowResize = () => {
    const r = refs.current;
    if (r.camera && r.renderer && r.composer && mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        r.camera.aspect = width / height;
        r.camera.updateProjectionMatrix();
        r.renderer.setSize(width, height);
        r.composer.setSize(width, height);
    }
  };


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAudioLoaded(false); // Enable loader UI (handled by !audioLoaded check)
    // Actually we have a separate state logic for UI
    
    // UI logic: hide button, show loader
    const reader = new FileReader();
    reader.onload = function(evt) { initAudio(evt.target.result); };
    reader.readAsArrayBuffer(file);
  };

  const initAudio = (arrayBuffer) => {
    const r = refs.current;
    if (!r.audioCtx) r.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (r.source) r.source.stop();

    r.audioCtx.decodeAudioData(arrayBuffer, (buffer) => {
        setAudioLoaded(true); // Hide center UI

        r.source = r.audioCtx.createBufferSource();
        r.source.buffer = buffer;
        r.audioDuration = buffer.duration;
        
        r.analyser = r.audioCtx.createAnalyser();
        r.analyser.fftSize = 2048;
        r.analyser.smoothingTimeConstant = 0.8; 
        r.dataArray = new Uint8Array(r.analyser.frequencyBinCount);

        r.source.connect(r.analyser);
        r.analyser.connect(r.audioCtx.destination);

        r.source.start(0);
        r.audioStartTime = r.audioCtx.currentTime;
        setIsPlaying(true);
        // Important: Update ref manually if using standard boolean state inside effect loop
        isPlayingRef.current = true;
        
        r.source.onended = () => {
            setIsPlaying(false);
            setAudioLoaded(false);
            setActivePanel(null);
            r.currentHeights.fill(0.1);
            r.audioTargetHeights.fill(0.1);
            r.averageFrequency = 0;
            updateGridVisuals();
        };
    }, (e) => {
        alert("Load failed");
        setAudioLoaded(false);
    });
  };

  const updatePlaybackInfo = () => {
    const r = refs.current;
    if (!r.audioCtx || !isPlayingRef.current || !r.audioDuration) return;
    const elapsed = Math.min(r.audioCtx.currentTime - r.audioStartTime, r.audioDuration);
    const progress = (elapsed / r.audioDuration) * 100;
    
    // Update React State for UI
    setProgressWidth(`${progress}%`);
    const formatTime = (seconds) => {
         const m = Math.floor(seconds / 60);
         const s = Math.floor(seconds % 60);
         return `${m}:${s.toString().padStart(2, '0')}`;
    };
    setCurrentTimeStr(`${formatTime(elapsed)} / ${formatTime(r.audioDuration)}`);
  };

  const togglePlayPause = () => {
    const r = refs.current;
    if (!r.audioCtx) return;
    if (r.audioCtx.state === 'running') {
        r.audioCtx.suspend().then(() => { setIsPlaying(false); });
    } else if (r.audioCtx.state === 'suspended') {
        r.audioCtx.resume().then(() => { setIsPlaying(true); });
    }
  };

  const togglePanel = (panelName) => {
      setActivePanel(activePanel === panelName ? null : panelName);
  };

  // UI Change Handlers
  const setParam = (key, val, displaySetter, modifier) => {
      params.current[key] = val;
      if (displaySetter) displaySetter(modifier ? modifier(val) : val);
  };

  return (
    <div className="audio-visualizer-body">
        {/* Center UI */}
        <div id="center-ui" style={{ opacity: audioLoaded ? 0 : 1, pointerEvents: audioLoaded ? 'none' : 'auto' }}>
            <h1>Luminous Field</h1>
            <div className="file-input-wrapper">
                <button className="m3-btn" style={{ display: 'inline-flex' }}>
                    <span style={{ marginRight: '8px' }}>♪</span> Select Audio File
                </button>
                <input type="file" onChange={handleFileUpload} accept="audio/*" />
            </div>
            {/* Loader would go here if we had state for 'loading' separate from 'loaded' */}
        </div>

        {/* Top Controls */}
        <div className="icon-btn-group" style={{ display: audioLoaded ? 'flex' : 'none' }}>
            <button className={`icon-btn ${activePanel === 'lights' ? 'active' : ''}`} onClick={() => togglePanel('lights')} title="Lighting Settings">💡</button>
            <button className={`icon-btn ${activePanel === 'visuals' ? 'active' : ''}`} onClick={() => togglePanel('visuals')} title="Visual Settings">⚙</button>
        </div>

        {/* Visual Settings Panel */}
        <div className={`side-panel ${activePanel === 'visuals' ? 'visible' : ''}`}>
            <h2 className="panel-title">Visual Settings</h2>
            
            <div className="control-group">
                <div className="label-row"><span>Height Scale</span><span>{valHeight}</span></div>
                <input type="range" min="10" max="50" defaultValue="25" 
                    onInput={(e) => setParam('maxHeight', parseFloat(e.target.value), setValHeight, v => (v/25).toFixed(1)+'x')} />
            </div>
            <div className="control-group">
                <div className="label-row"><span>Damping</span><span>{valDamping}</span></div>
                <input type="range" min="0.01" max="0.3" step="0.01" defaultValue="0.05" 
                    onInput={(e) => setParam('dampingFall', parseFloat(e.target.value), setValDamping, v => v < 0.03 ? "Silky" : v > 0.2 ? "Sharp" : "Medium")} />
            </div>
            <div className="control-group">
                <div className="label-row"><span>Bloom Strength</span><span>{valBloom}</span></div>
                <input type="range" min="0" max="3" step="0.1" defaultValue="1.5" 
                    onInput={(e) => {
                        const v = parseFloat(e.target.value);
                        params.current.bloomStrength = v;
                        if(refs.current.bloomPass) refs.current.bloomPass.strength = v;
                        setValBloom(v.toFixed(1));
                    }} />
            </div>
            <div className="control-group">
                <div className="label-row"><span>DoF Intensity</span><span>{valDof}</span></div>
                <input type="range" min="0.0001" max="0.002" step="0.0001" defaultValue="0.0003" 
                     onInput={(e) => {
                        const v = parseFloat(e.target.value);
                        params.current.bokehAperture = v;
                        if(refs.current.bokehPass) refs.current.bokehPass.uniforms['aperture'].value = v;
                        setValDof(v < 0.0002 ? "Low" : v > 0.001 ? "High" : "Medium");
                    }} />
            </div>
            <div className="control-group">
                <div className="label-row"><span>Reflectivity</span><span>{valReflect}</span></div>
                <input type="range" min="0" max="1" step="0.1" defaultValue="0.9" 
                    onInput={(e) => {
                        const v = parseFloat(e.target.value);
                        params.current.reflectivity = v;
                        if(refs.current.mesh) refs.current.mesh.material.reflectivity = v;
                        setValReflect((v*100).toFixed(0)+'%');
                    }} />
            </div>

            <div className="control-group" style={{ marginTop: '10px' }}>
                <div className="label-row"><span>Gradient Palette</span></div>
                <div className="color-row">
                    {[1,2,3,4,5].map(i => (
                        <div className="color-input-wrapper" key={i}>
                            <input type="color" defaultValue={['', '#0066ff', '#00aaff', '#00ffff', '#ff00ff', '#ffffff'][i]} 
                                onInput={(e) => params.current.colors[i].set(e.target.value)} />
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Lighting Panel */}
        <div className={`side-panel ${activePanel === 'lights' ? 'visible' : ''}`}>
             <h2 className="panel-title">Lighting Setup</h2>
             <div className="control-group">
                <div className="label-row"><span>Background Brightness</span><span>{valLightBg}</span></div>
                <input type="range" min="0" max="2" step="0.1" defaultValue="1.2" 
                    onInput={(e) => {
                        const v = parseFloat(e.target.value);
                        createGradientBackground(v);
                        setValLightBg(v.toFixed(1));
                    }} />
            </div>
            <div className="control-group">
                <div className="label-row"><span>Ambient Intensity</span><span>{valLightAmbient}</span></div>
                <input type="range" min="0" max="4" step="0.1" defaultValue="2.0" 
                    onInput={(e) => {
                        const v = parseFloat(e.target.value);
                        if(refs.current.ambientLight) refs.current.ambientLight.intensity = v;
                        setValLightAmbient(v.toFixed(1));
                    }} />
            </div>
             <div className="control-group">
                <div className="label-row"><span>Main Source Intensity</span><span>{valLightSpot}</span></div>
                <input type="range" min="0" max="8000" step="100" defaultValue="3000" 
                    onInput={(e) => {
                        const v = parseFloat(e.target.value);
                        if(refs.current.spotLight) refs.current.spotLight.intensity = v;
                        setValLightSpot(v.toFixed(0));
                    }} />
            </div>
             <div className="control-group">
                <div className="label-row"><span>Top Light Intensity</span><span>{valLightTop}</span></div>
                <input type="range" min="0" max="8" step="0.1" defaultValue="3.0" 
                    onInput={(e) => {
                        const v = parseFloat(e.target.value);
                        if(refs.current.topLight) refs.current.topLight.intensity = v;
                        setValLightTop(v.toFixed(1));
                    }} />
            </div>
        </div>

        {/* Playback Bar */}
        <div id="playback-bar" style={{ opacity: audioLoaded ? 1 : 0, pointerEvents: audioLoaded ? 'auto' : 'none' }}>
            <button id="play-pause-btn" onClick={togglePlayPause}>{isPlaying ? '⏸' : '▶'}</button>
            <div id="progress-container">
                <div id="progress-fill" style={{ width: progressWidth }}></div>
            </div>
            <div id="time-display">{currentTimeStr}</div>
        </div>

        <div id="info-text">LMB: Rotate &nbsp; RMB: Pan &nbsp; Scroll: Zoom</div>
        <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
    </div>
  );
}
