import * as THREE from 'three';

export type SceneQuality = 'medium' | 'high';

export class DataSculpture {
  private host: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  private group = new THREE.Group();
  private particles!: THREE.Points;
  private lines!: THREE.LineSegments;
  private targetScale = new THREE.Vector3(1, 1, 1);
  private pointer = new THREE.Vector2();
  private targetPointer = new THREE.Vector2();
  private scroll = 0;
  private speed = 1;
  private scatter = 0;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private mobile = innerWidth < 720;
  private documentVisible = !document.hidden;
  private intersecting = true;
  private initialized = false;
  private disposed = false;
  private lastFrameTime = 0;
  private frameInterval: number;
  private frame: number | undefined;
  private scatterTimer: number | undefined;
  private intersectionObserver?: IntersectionObserver;
  private removalObserver?: MutationObserver;

  constructor(host: HTMLElement, private quality: SceneQuality = 'high') {
    this.host = host;
    this.frameInterval = quality === 'medium' ? 1000 / 30 : 0;
  }

  get element() { return this.host; }

  init() {
    if (this.initialized || this.disposed) return;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: this.quality === 'high' && !this.mobile, alpha: true, powerPreference: this.quality === 'medium' ? 'low-power' : 'high-performance' });
    } catch { this.fallback(); return; }
    this.initialized = true;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.quality === 'medium' ? 1.25 : this.mobile ? 1.35 : 1.8));
    this.renderer.setClearColor(0x000000, 0); this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    this.host.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 0, 8.5); this.scene.add(this.group);
    this.createGeometry(); this.resize();
    addEventListener('resize', this.resize); addEventListener('pointermove', this.onPointer, { passive: true });
    addEventListener('scroll', this.onScroll, { passive: true }); document.addEventListener('visibilitychange', this.onVisibility);
    addEventListener('scene-command', this.onCommand as EventListener);
    if (this.mobile) this.host.addEventListener('touchmove', this.onTouch, { passive: true });
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(([entry]) => {
        this.intersecting = entry.isIntersecting;
        this.updateAnimation();
      });
      this.intersectionObserver.observe(this.host);
    } else {
      this.intersecting = true;
    }
    this.removalObserver = new MutationObserver(() => {
      if (!this.host.isConnected) this.destroy();
    });
    this.removalObserver.observe(document.body, { childList: true, subtree: true });
    this.host.dataset.rendered = 'true'; this.updateAnimation();
  }

  private createGeometry() {
    const count = this.quality === 'medium' ? (this.mobile ? 650 : 1400) : (this.mobile ? 900 : 2600);
    const positions = new Float32Array(count * 3); const colors = new Float32Array(count * 3);
    const palette = [new THREE.Color('#f1efe6'), new THREE.Color('#ff4d24'), new THREE.Color('#20aa89'), new THREE.Color('#e8b62c')];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2; const band = (Math.random() - .5) * 4.8;
      const radius = 1.65 + Math.sin(t * 3 + band) * .45 + Math.random() * .38;
      positions[i * 3] = Math.cos(t) * radius + Math.sin(band * 2) * .35;
      positions[i * 3 + 1] = band * .72;
      positions[i * 3 + 2] = Math.sin(t) * radius + Math.cos(band * 1.4) * .45;
      const color = palette[Math.random() > .88 ? 1 + Math.floor(Math.random() * 3) : 0]; colors.set(color.toArray(), i * 3);
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particles = new THREE.Points(geometry, new THREE.PointsMaterial({ size: this.mobile ? .025 : .018, vertexColors: true, transparent: true, opacity: .92, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.group.add(this.particles);

    const linePositions: number[] = [];
    for (let ring = -5; ring <= 5; ring++) for (let i = 0; i < 48; i++) {
      const y = ring * .38; const a = (i / 48) * Math.PI * 2; const b = ((i + 1) / 48) * Math.PI * 2; const r = 1.8 + Math.sin(a * 3 + y) * .22;
      linePositions.push(Math.cos(a) * r, y, Math.sin(a) * r, Math.cos(b) * r, y, Math.sin(b) * r);
    }
    const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    this.lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x8e918c, transparent: true, opacity: .16, blending: THREE.AdditiveBlending })); this.group.add(this.lines);
  }

  private resize = () => { const { clientWidth: w, clientHeight: h } = this.host; this.camera.aspect = w / Math.max(h, 1); this.camera.updateProjectionMatrix(); this.renderer?.setSize(w, h, false); };
  private onPointer = (e: PointerEvent) => { this.targetPointer.set((e.clientX / innerWidth - .5) * 2, (e.clientY / innerHeight - .5) * 2); };
  private onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) this.targetPointer.set((t.clientX / innerWidth - .5) * 1.4, (t.clientY / innerHeight - .5) * 1.4); };
  private onScroll = () => { this.scroll = Math.min(scrollY / innerHeight, 1.8); };
  private onVisibility = () => { this.documentVisible = !document.hidden; this.updateAnimation(); };
  private onContextLost = (event: Event) => {
    event.preventDefault();
    this.fallback();
    this.destroy();
  };
  private onCommand = (e: CustomEvent<string>) => { if (e.detail === 'calm') this.speed = .2; if (e.detail === 'focus') { this.scatter = -.45; this.speed = .55; } if (e.detail === 'scatter') { this.scatter = 1.2; window.clearTimeout(this.scatterTimer); this.scatterTimer = window.setTimeout(() => this.scatter = 0, 2200); } };
  private fallback() { this.host.classList.add('scene-fallback'); this.host.dataset.rendered = 'fallback'; }

  private updateAnimation() {
    if (this.disposed || !this.initialized || !this.documentVisible || !this.intersecting) {
      if (this.frame !== undefined) cancelAnimationFrame(this.frame);
      this.frame = undefined;
      return;
    }
    if (this.reduced) {
      this.renderFrame(performance.now());
      return;
    }
    if (this.frame === undefined) this.frame = requestAnimationFrame(this.animate);
  }

  private animate = (time: number) => {
    this.frame = undefined;
    if (this.disposed || !this.documentVisible || !this.intersecting) return;
    if (this.frameInterval && time - this.lastFrameTime < this.frameInterval) {
      this.frame = requestAnimationFrame(this.animate);
      return;
    }
    this.renderFrame(time);
    this.frame = requestAnimationFrame(this.animate);
  };

  private renderFrame(time: number) {
    this.lastFrameTime = time;
    const t = time * .00018 * (this.reduced ? .08 : this.speed);
    this.pointer.lerp(this.targetPointer, .035);
    this.group.rotation.y = t + this.pointer.x * .18 + this.scroll * .48;
    this.group.rotation.x = -.15 + this.pointer.y * .12 + this.scroll * .14;
    const targetScale = 1 + this.scatter; this.targetScale.setScalar(targetScale); this.group.scale.lerp(this.targetScale, .025);
    this.camera.position.x += (this.pointer.x * .45 - this.camera.position.x) * .025;
    this.camera.position.y += (-this.pointer.y * .28 - this.scroll * .45 - this.camera.position.y) * .025;
    this.camera.lookAt(0, -this.scroll * .22, 0); this.lines.rotation.y = -t * .7;
    this.renderer.render(this.scene, this.camera);
    if (this.host.dataset.painted !== 'true') this.host.dataset.painted = 'true';
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    window.clearTimeout(this.scatterTimer);
    this.intersectionObserver?.disconnect();
    this.removalObserver?.disconnect();
    removeEventListener('resize', this.resize);
    removeEventListener('pointermove', this.onPointer);
    removeEventListener('scroll', this.onScroll);
    document.removeEventListener('visibilitychange', this.onVisibility);
    removeEventListener('scene-command', this.onCommand as EventListener);
    this.host.removeEventListener('touchmove', this.onTouch);
    this.renderer?.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.particles?.geometry.dispose();
    (this.particles?.material as THREE.Material | undefined)?.dispose();
    this.lines?.geometry.dispose();
    (this.lines?.material as THREE.Material | undefined)?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.scene.clear();
  }
}
