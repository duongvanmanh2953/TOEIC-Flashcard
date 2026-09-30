import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundManager } from '../services/sound/KidsSoundManager';

interface KidsRobot3DViewerProps {
  assembledSlots: {
    head: boolean;
    left_arm: boolean;
    body: boolean;
    right_arm: boolean;
    left_leg: boolean;
    right_leg: boolean;
  };
  isAlive: boolean;
  className?: string;
}

export const KidsRobot3DViewer: React.FC<KidsRobot3DViewerProps> = ({
  assembledSlots,
  isAlive,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [bootPhase, setBootPhase] = useState<'standby' | 'booting' | 'hero_pose'>('standby');

  useEffect(() => {
    if (isAlive) {
      setBootPhase('booting');
      const timer = setTimeout(() => {
        setBootPhase('hero_pose');
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setBootPhase('standby');
    }
  }, [isAlive]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean white/light-gray studio background

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.6, 5.4);

    // 2. WebGL Renderer with soft PCF shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting (Clean Robotics Lab Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Key Light (Crisp white studio key)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Rim Fill Light (Subtle Cyan Rim for futuristic aesthetic)
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.0);
    rimLight.position.set(-4, 4, -3);
    scene.add(rimLight);

    // Floor Soft Bounce
    const floorBounce = new THREE.DirectionalLight(0xe2e8f0, 0.8);
    floorBounce.position.set(0, -3, 2);
    scene.add(floorBounce);

    // Dynamic Light Sweep on Armor
    const sweepLight = new THREE.PointLight(0xffffff, 0, 8);
    sweepLight.position.set(-3, 1, 2);
    scene.add(sweepLight);

    // 4. Subtle Studio Grid Floor & Soft Shadow Catcher
    const gridHelper = new THREE.GridHelper(8, 16, 0xcbd5e1, 0xe2e8f0);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    const shadowPlaneGeo = new THREE.PlaneGeometry(6, 6);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.49;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 5. Materials: Pearl White Armor + Graphite Joints + Cyan Laser Visor
    const pearlWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.15,
      roughness: 0.18,
    });

    const graphiteMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.22,
    });

    const cyanAccentMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.6,
      roughness: 0.2,
    });

    const visorGlowMat = new THREE.MeshBasicMaterial({
      color: isAlive ? 0x22d3ee : 0x475569,
    });

    const reactorCoreMat = new THREE.MeshBasicMaterial({
      color: isAlive ? 0xf59e0b : 0x334155,
    });

    const hologramMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });

    // 6. Humanoid Robot Hierarchical Rig
    const robotRig = new THREE.Group();
    robotRig.position.y = -0.2;
    scene.add(robotRig);

    // =========================================================================
    // CHEST & TORSO (Pelvis + Spine + Muscular Chest Plate + Core)
    // =========================================================================
    const torsoGroup = new THREE.Group();
    robotRig.add(torsoGroup);

    if (assembledSlots.body) {
      // Main Chest Plate (Tapered trapezoid)
      const chestGeo = new THREE.BoxGeometry(1.2, 0.9, 0.65);
      const chestMesh = new THREE.Mesh(chestGeo, pearlWhiteMat);
      chestMesh.position.set(0, 0.45, 0);
      chestMesh.castShadow = true;
      torsoGroup.add(chestMesh);

      // Abdomen / Midsection (Graphite flex joint)
      const midGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.45, 12);
      const midMesh = new THREE.Mesh(midGeo, graphiteMetalMat);
      midMesh.position.set(0, -0.15, 0);
      midMesh.castShadow = true;
      torsoGroup.add(midMesh);

      // Pelvis Block
      const pelvisGeo = new THREE.BoxGeometry(0.9, 0.35, 0.55);
      const pelvisMesh = new THREE.Mesh(pelvisGeo, pearlWhiteMat);
      pelvisMesh.position.set(0, -0.45, 0);
      torsoGroup.add(pelvisMesh);

      // Arc Reactor Energy Core
      const reactorGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16);
      reactorGeo.rotateX(Math.PI / 2);
      const reactorMesh = new THREE.Mesh(reactorGeo, reactorCoreMat);
      reactorMesh.position.set(0, 0.48, 0.34);
      torsoGroup.add(reactorMesh);
    } else {
      // Hologram ghost frame
      const ghostGeo = new THREE.BoxGeometry(1.2, 1.2, 0.65);
      const ghost = new THREE.Mesh(ghostGeo, hologramMat);
      ghost.position.set(0, 0.2, 0);
      torsoGroup.add(ghost);
    }

    // =========================================================================
    // HEAD & HELMET (Angular Cranium + Cyan LED Visor)
    // =========================================================================
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.15, 0);
    robotRig.add(headGroup);

    if (assembledSlots.head) {
      // Neck actuator
      const neckGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.25, 12);
      const neckMesh = new THREE.Mesh(neckGeo, graphiteMetalMat);
      neckMesh.position.set(0, -0.1, 0);
      headGroup.add(neckMesh);

      // Helmet Cranium
      const helmetGeo = new THREE.BoxGeometry(0.68, 0.62, 0.65);
      const helmetMesh = new THREE.Mesh(helmetGeo, pearlWhiteMat);
      helmetMesh.castShadow = true;
      headGroup.add(helmetMesh);

      // Cyan Visor Slit
      const visorGeo = new THREE.BoxGeometry(0.54, 0.16, 0.15);
      const visorMesh = new THREE.Mesh(visorGeo, visorGlowMat);
      visorMesh.position.set(0, 0.05, 0.32);
      headGroup.add(visorMesh);

      // Side Sensor Pods (Ears)
      const earLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.15, 8), graphiteMetalMat);
      earLeft.rotation.z = Math.PI / 2;
      earLeft.position.set(-0.38, 0.05, 0);
      headGroup.add(earLeft);

      const earRight = earLeft.clone();
      earRight.position.x = 0.38;
      headGroup.add(earRight);
    } else {
      const ghostHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), hologramMat);
      ghostHead.position.set(0, 0.2, 0);
      headGroup.add(ghostHead);
    }

    // =========================================================================
    // LEFT ARM (Shoulder Ball Joint + Bicep + Forearm Guard + Clenched Fist)
    // =========================================================================
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.78, 0.75, 0);
    robotRig.add(leftArmPivot);

    if (assembledSlots.left_arm) {
      // Shoulder Ball
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), graphiteMetalMat);
      leftArmPivot.add(shoulder);

      // Pauldron Armor Cap
      const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.44), cyanAccentMat);
      pauldron.position.set(-0.06, 0.1, 0);
      leftArmPivot.add(pauldron);

      // Upper Arm
      const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.5, 8), pearlWhiteMat);
      bicep.position.set(0, -0.32, 0);
      leftArmPivot.add(bicep);

      // Forearm & Fist
      const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.34), pearlWhiteMat);
      forearm.position.set(0, -0.72, 0.05);
      leftArmPivot.add(forearm);

      const fist = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.26), graphiteMetalMat);
      fist.position.set(0, -1.05, 0.05);
      leftArmPivot.add(fist);
    }

    // =========================================================================
    // RIGHT ARM (Pauldron + Forearm + Heroic Fist)
    // =========================================================================
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.78, 0.75, 0);
    robotRig.add(rightArmPivot);

    if (assembledSlots.right_arm) {
      const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), graphiteMetalMat);
      rightArmPivot.add(shoulderR);

      const pauldronR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.44), cyanAccentMat);
      pauldronR.position.set(0.06, 0.1, 0);
      rightArmPivot.add(pauldronR);

      const bicepR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.5, 8), pearlWhiteMat);
      bicepR.position.set(0, -0.32, 0);
      rightArmPivot.add(bicepR);

      const forearmR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.34), pearlWhiteMat);
      forearmR.position.set(0, -0.72, 0.05);
      rightArmPivot.add(forearmR);

      const fistR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.26), graphiteMetalMat);
      fistR.position.set(0, -1.05, 0.05);
      rightArmPivot.add(fistR);
    }

    // =========================================================================
    // LEFT LEG (Hip + Thigh + Knee Hydraulic + Heavy Boot)
    // =========================================================================
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.35, -0.55, 0);
    robotRig.add(leftLegGroup);

    if (assembledSlots.left_leg) {
      // Thigh
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.65, 0.35), pearlWhiteMat);
      thigh.position.set(0, -0.32, 0);
      leftLegGroup.add(thigh);

      // Knee Servo Joint
      const knee = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.36, 10), graphiteMetalMat);
      knee.rotation.z = Math.PI / 2;
      knee.position.set(0, -0.65, 0.05);
      leftLegGroup.add(knee);

      // Shin Guard
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.65, 0.38), pearlWhiteMat);
      shin.position.set(0, -1.05, 0);
      leftLegGroup.add(shin);

      // Planted Foot
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.65), graphiteMetalMat);
      foot.position.set(0, -1.45, 0.12);
      leftLegGroup.add(foot);
    }

    // =========================================================================
    // RIGHT LEG
    // =========================================================================
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.35, -0.55, 0);
    robotRig.add(rightLegGroup);

    if (assembledSlots.right_leg) {
      const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.65, 0.35), pearlWhiteMat);
      thighR.position.set(0, -0.32, 0);
      rightLegGroup.add(thighR);

      const kneeR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.36, 10), graphiteMetalMat);
      kneeR.rotation.z = Math.PI / 2;
      kneeR.position.set(0, -0.65, 0.05);
      rightLegGroup.add(kneeR);

      const shinR = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.65, 0.38), pearlWhiteMat);
      shinR.position.set(0, -1.05, 0);
      rightLegGroup.add(shinR);

      const footR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.65), graphiteMetalMat);
      footR.position.set(0, -1.45, 0.12);
      rightLegGroup.add(footR);
    }

    // =========================================================================
    // TOUCH / MOUSE 360° ORBIT DRAGGING
    // =========================================================================
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      targetRotationY += deltaX * 0.012;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // =========================================================================
    // 60FPS RENDER LOOP WITH BOOT SEQUENCE & HERO POSE
    // =========================================================================
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth rotation dampening
      robotRig.rotation.y += (targetRotationY - robotRig.rotation.y) * 0.1;

      // HERO POSE & CINEMATIC PUSH-IN
      if (isAlive) {
        // Dramatic Light Sweep across armor
        sweepLight.intensity = Math.sin(elapsedTime * 2) * 1.5 + 1.5;
        sweepLight.position.x = Math.sin(elapsedTime * 1.5) * 4;

        // Visor Laser Pulse
        visorGlowMat.color.setHSL(0.52, 0.95, 0.45 + Math.sin(elapsedTime * 5) * 0.15);

        // Core Reactor Pulsing
        reactorCoreMat.color.setHSL(0.12, 1.0, 0.5 + Math.sin(elapsedTime * 4) * 0.2);

        // HERO POSE POSTURE:
        // Left Arm: resting firmly on hip
        leftArmPivot.rotation.z = -0.55;
        leftArmPivot.rotation.x = 0.25;

        // Right Arm: clenched fist thrust forward confidently
        rightArmPivot.rotation.x = -0.65;
        rightArmPivot.rotation.z = 0.22;

        // Torso: chest out, proud posture
        torsoGroup.rotation.x = -0.05;
        headGroup.rotation.x = -0.06;

        // Camera subtle push-in
        camera.position.z += (4.4 - camera.position.z) * 0.04;
      } else {
        // Idle gentle breathing motion
        const breath = Math.sin(elapsedTime * 2) * 0.02;
        torsoGroup.position.y = breath;
        camera.position.z += (5.4 - camera.position.z) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [assembledSlots, isAlive]);

  return (
    <div className={`relative w-full rounded-3xl overflow-hidden bg-slate-50 border-2 border-slate-200 shadow-sm ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-[360px] sm:h-[400px] cursor-grab active:cursor-grabbing" />

      {/* Futuristic Studio HUD Watermark */}
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
        <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
          {isAlive ? 'ROBOT LAB // SYSTEM ONLINE' : 'ROBOT LAB // ASSEMBLY BENCH'}
        </span>
      </div>

      {/* 360° Interaction Hint */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
        <span className="px-3.5 py-1 rounded-full bg-white/90 border border-slate-200 text-[10px] font-black text-slate-600 shadow-sm">
          🖐️ Dùng ngón tay hoặc chuột kéo để xoay 360°
        </span>
      </div>
    </div>
  );
};

export default KidsRobot3DViewer;
