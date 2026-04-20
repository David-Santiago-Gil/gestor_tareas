import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-logo-animado',
  standalone: true,
  template: `<div #canvasContainer class="canvas-container" title="3D Logo animado nativamente con Three.js"></div>`,
  styles: [`
    .canvas-container {
      width: 80px;
      height: 80px;
      cursor: pointer;
      display: block;
      margin-bottom: 0px;
    }
  `]
})
export class LogoAnimadoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private logoGroup!: THREE.Group;
  private animationId?: number;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initThreeJS();
      this.animate();
    }
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }

  private initThreeJS() {
    const w = 80;
    const h = 80;

    this.scene = new THREE.Scene();

    // Setup Camera
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 16);
    this.camera.lookAt(0, 0, 0);

    // Setup Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);

    this.logoGroup = new THREE.Group();

    // 1. Dark Glass/Metallic Core Material
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x030f26,
      emissive: 0x001133,
      roughness: 0.2,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    // 2. Neon Cyan Wireframe Edges Material
    const neonEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 1.0,
    });
    
    // 3. Faded Inner Circuit Edges
    const faintEdgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00b4d8,
      transparent: true,
      opacity: 0.4,
    });

    // Hexagon Frame Geometry
    const hexRadius = 4.5;
    const hexShape = new THREE.Shape();
    // Pointy top hexagon
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + (Math.PI / 6);
        const x = hexRadius * Math.cos(angle);
        const y = hexRadius * Math.sin(angle);
        if (i === 0) hexShape.moveTo(x, y);
        else hexShape.lineTo(x, y);
    }
    hexShape.closePath();

    const innerRadius = 3.6;
    const holePath = new THREE.Path();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + (Math.PI / 6);
        const x = innerRadius * Math.cos(angle);
        const y = innerRadius * Math.sin(angle);
        if (i === 0) holePath.moveTo(x, y);
        else holePath.lineTo(x, y);
    }
    holePath.closePath();
    hexShape.holes.push(holePath);

    const extrudeSettings = { depth: 0.7, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.15, bevelThickness: 0.15 };
    const hexGeo = new THREE.ExtrudeGeometry(hexShape, extrudeSettings);
    hexGeo.translate(0, 0, -0.35); // Center Z

    // Hex Mesh
    const hexMesh = new THREE.Mesh(hexGeo, coreMaterial);
    
    // Hex Edges (The bright glowing outline)
    const hexEdgesGeo = new THREE.EdgesGeometry(hexGeo, 15);
    const hexEdges = new THREE.LineSegments(hexEdgesGeo, neonEdgeMaterial);
    hexMesh.add(hexEdges);

    // Inner Floating "Circuit" Hexagons (Details)
    const innerHexGeo = new THREE.EdgesGeometry(new THREE.CylinderGeometry(innerRadius - 0.4, innerRadius - 0.4, 0.2, 6));
    innerHexGeo.rotateX(Math.PI / 2);
    innerHexGeo.rotateZ(Math.PI / 6);
    const innerHexLines = new THREE.LineSegments(innerHexGeo, faintEdgeMaterial);
    hexMesh.add(innerHexLines);

    // Checkmark Geometry
    const checkShape = new THREE.Shape();
    checkShape.moveTo(-1.5, -0.2);
    checkShape.lineTo(-0.2, -1.8);
    checkShape.lineTo(3.2, 2.8); // Extended outwards
    checkShape.lineTo(2.0, 3.4);
    checkShape.lineTo(-0.2, 0.4);
    checkShape.lineTo(-0.6, 0.8);
    checkShape.closePath();

    const checkGeo = new THREE.ExtrudeGeometry(checkShape, { depth: 0.9, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.1, bevelThickness: 0.1 });
    checkGeo.translate(-0.4, -0.6, -0.45); // align to center
    
    // Checkmark Mesh
    const checkMesh = new THREE.Mesh(checkGeo, coreMaterial);
    
    // Checkmark Edges
    const checkEdgesGeo = new THREE.EdgesGeometry(checkGeo, 15);
    const checkEdges = new THREE.LineSegments(checkEdgesGeo, neonEdgeMaterial);
    checkMesh.add(checkEdges);
    
    this.logoGroup.add(hexMesh);
    this.logoGroup.add(checkMesh);

    // Initial slight tilt
    this.logoGroup.rotation.x = -Math.PI / 8;

    this.scene.add(this.logoGroup);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00ffff, 400, 50);
    pointLight.position.set(5, 5, 10);
    this.scene.add(pointLight);

    const fillLight = new THREE.PointLight(0x7ec8e3, 300, 50);
    fillLight.position.set(-5, -5, -5);
    this.scene.add(fillLight);
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    
    if (this.logoGroup) {
      // Rotate the whole logo slowly
      this.logoGroup.rotation.y += 0.010; 
      
      // Add a slight hover float effect
      const time = Date.now() * 0.002;
      this.logoGroup.position.y = Math.sin(time) * 0.3;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
