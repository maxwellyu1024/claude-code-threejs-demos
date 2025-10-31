import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";

const chromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.0005 },
  },
  vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
  fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float amount;
      varying vec2 vUv;

      void main() {
        vec2 offset = amount * (vUv - 0.5);
        vec4 cr = texture2D(tDiffuse, vUv + offset);
        vec4 cga = texture2D(tDiffuse, vUv);
        vec4 cb = texture2D(tDiffuse, vUv - offset);
        gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
      }
    `,
};

const filmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    amount: { value: 0.025 },
  },
  vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float amount;
        uniform float uTime;
        varying vec2 vUv;

        float random(vec2 co) {
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            float grain = random(vUv * vec2(800.0, 600.0) + mod(float(gl_FragCoord.x + gl_FragCoord.y + uTime), 100.0));
            grain = (grain - 0.5) * amount * 2.0;

            float noise = (fract(sin(dot(vUv, vec2(12.9898,78.233)*2.0)) * 43758.5453));
            color.rgb -= noise * amount - grain;

            gl_FragColor = color * 0.5;
        }
    `,
};

const StarConverter = {
  /**
   * Convert ultra-compact format back to GeoJSON for map libraries
   * @param {Object} compactData - Ultra-compact star data
   * @returns {Object} GeoJSON FeatureCollection
   */
  ultraCompactToGeoJSON(compactData) {
    return {
      type: "FeatureCollection",
      features: compactData.data.map((star) => ({
        type: "Feature",
        id: star[0],
        properties: {
          mag: star[3],
          bv: star[4],
        },
        geometry: {
          type: "Point",
          coordinates: [star[1], star[2]],
        },
      })),
    };
  },

  /**
   * Get stars by magnitude range from ultra-compact format
   * @param {Object} compactData - Ultra-compact star data
   * @param {number} minMag - Minimum magnitude (brightest)
   * @param {number} maxMag - Maximum magnitude (dimmest)
   * @returns {Array} Filtered star array
   */
  filterStarsByMagnitude(compactData, minMag = -2, maxMag = 6) {
    return compactData.data.filter((star) => {
      const mag = star[3];
      return mag >= minMag && mag <= maxMag;
    });
  },
};

class StarField {
  constructor() {
    this.container = document.querySelector(
      ".claude-astronomy-demo__canvas-container"
    );
    this.canvasContainer = document.querySelector(
      "[data-astronomy-canvas-container]"
    );
    this.emptyState = document.querySelector("[data-astronomy-empty-state]");
    this.starCount = document.querySelector("[data-star-count]");

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.composer = new EffectComposer(this.renderer);
    this.controls = null;
    this.stars = [];
    this.particleSystem = null;
    this.currentZoom = 5.5;
    this.targetZoom = 5.5;
    this.time = 0;
    this.loadingDetailedStars = false;
    this.hasDetailedStars = false;
    this.isInitialized = false;
    this.animationId = null;

    this.init();
  }

  async init() {
    // Check if container is visible before initializing
    if (this.container.offsetWidth === 0 || this.container.offsetHeight === 0) {
      // Container is hidden, wait for it to become visible
      this.waitForVisibility();
      return;
    }

    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container?.appendChild(this.renderer.domElement);

    this.camera.position.z = 5;

    await this.loadStarData();

    await this.createStarSystem();

    this.setupControls();

    this.setupPostProcessing();

    window.addEventListener("resize", this.onWindowResize.bind(this));
    this.onWindowResize();

    this.animate();
    this.isInitialized = true;
  }

  waitForVisibility() {
    // Use Intersection Observer to detect when container becomes visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.isInitialized) {
          this.init();
          observer.disconnect();
        }
      });
    });
    observer.observe(this.container);
  }

  // Add method to reinitialize when tab becomes visible
  reinitialize() {
    if (this.isInitialized) {
      // Stop current animation
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }

      // Clean up Three.js scene
      this.cleanupScene();

      // Remove existing canvas if it exists
      const existingCanvas = this.container.querySelector("canvas");
      if (existingCanvas) {
        existingCanvas.remove();
      }

      // Reset state
      this.isInitialized = false;
      this.animationId = null;

      // Reinitialize
      this.init();
    }
  }

  // Add cleanup method for Three.js scene
  cleanupScene() {
    // Remove all objects from scene
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      this.scene.remove(child);

      // Dispose of geometry and materials if they exist
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    // Dispose of renderer
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Dispose of composer
    if (this.composer) {
      this.composer.dispose();
    }

    // Reset particle system reference
    this.particleSystem = null;
  }

  removeEmptyState() {
    if (!this.emptyState || !this.emptyStateVisible) return;

    this.emptyStateVisible = false;

    // Simple fade out without gsap dependency
    this.emptyState.style.transition = "opacity 0.65s, transform 0.65s";
    this.emptyState.style.opacity = "0";
    this.emptyState.style.transform = "translate(-50%, -50%) scale(0.95)";

    setTimeout(() => {
      this.emptyState.remove();
    }, 650);
  }

  async loadStarData() {
    try {
      const fastResponse = await fetch("data.json");
      const fastData = await fastResponse.json();

      // No conversion needed - it's already GeoJSON!
      this.stars = fastData.features;

      this.updateStarCount();
      this.loadDetailedStars();
    } catch (error) {
      console.error("Error loading initial star data:", error);
    }
  }

  async loadDetailedStars() {
    if (this.loadingDetailedStars || this.hasDetailedStars) return;

    this.loadingDetailedStars = true;

    try {
      const response = await fetch("./public/stars-ultra-compact.json");
      const detailedData = await response.json();

      const detailedStars = StarConverter.ultraCompactToGeoJSON(detailedData);

      this.stars = detailedStars.features;
      this.hasDetailedStars = true;

      this.updateStarCount();

      if (this.particleSystem) {
        this.scene.remove(this.particleSystem);
        this.particleSystem = null;
      }
      await this.createStarSystem();
    } catch (error) {
      console.error("Error loading detailed star data:", error);
    } finally {
      this.loadingDetailedStars = false;
    }
  }

  updateStarCount() {
    if (this.starCount) {
      const formatter = new Intl.NumberFormat("en-US", {
        notation: "standard",
      });
      this.starCount.textContent = formatter.format(this.stars.length);
    }
  }

  createStarSystem() {
    if (!this.stars.length) return;

    const starCount = this.stars.length;

    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const colors = new Float32Array(starCount * 3);

    const radius = 2.25;

    this.stars.forEach((star, i) => {
      const [lon, lat] = star.geometry.coordinates;
      const magnitude = star.properties.mag;
      const colorIndex = star.properties.bv || 0;

      // Convert spherical coordinates to Cartesian
      // Convert Longitude and latitude (degrees) to radians
      const phi = ((90 - lat) * Math.PI) / 180; // polar angle
      const theta = ((lon + 180) * Math.PI) / 180; // azimuthal angle

      const noiseAmount = 0.07;

      // Use a simple pseudo-random function based on star index for repeatability
      function pseudoRandom(seed) {
        return fract(Math.sin(seed) * 43758.5453123);
      }

      function fract(x) {
        return x - Math.floor(x);
      }

      // Generate three pseudo-random values for each axis, using star index and phi/theta for more variety
      const nx = (pseudoRandom(i * 1.13 + phi * 0.91) - 0.5) * noiseAmount;
      const ny = (pseudoRandom(i * 2.71 + theta * 1.37) - 0.5) * noiseAmount;
      const nz =
        (pseudoRandom(i * 3.33 + phi * 0.53 + theta * 0.77) - 0.5) *
        (noiseAmount * 1.5);

      // Optionally, modulate noise by magnitude for fainter stars to have more scatter
      const magFactor = 1 + Math.max(0, (magnitude - 2) * 2);

      const x = radius * Math.sin(phi) * Math.cos(theta) + nx * magFactor;
      const y = radius * Math.cos(phi) + ny * magFactor;
      const z = radius * Math.sin(phi) * Math.sin(theta) + nz * magFactor;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Size based on magnitude (brighter stars = lower magnitude = larger size)
      // Magnitude range is roughly -1 to 6, invert and scale
      const size = Math.max(0.5, (7 - magnitude) * 0.5);
      sizes[i] = size;

      // Color based on B-V color index
      // Blue stars: negative B-V, Red stars: positive B-V
      const color = this.getStarColor(colorIndex);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    geometry.computeBoundingSphere();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        pixelRatio: { value: this.renderer.getPixelRatio() },
        resolution: {
          value: new THREE.Vector2(
            this.container.clientWidth,
            this.container.clientHeight
          ),
        },
        uTime: { value: 0 },
      },
      vertexShader: `
                attribute float size;
                varying vec3 vColor;
                varying float vSize;
                varying float vDistance;

                uniform float pixelRatio;
                uniform float uTime;

                float random(vec2 co) {
                    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
                }

                void main() {
                    vColor = color;
                    vSize = size;

                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vDistance = -mvPosition.z;

                    // Adaptive point sizing based on distance
                    float baseSize = size * (8.0 / vDistance) + (sin(uTime * 0.1) * 0.5);
                    gl_PointSize = baseSize * pixelRatio;

                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
      fragmentShader: `
                uniform float uTime;
                uniform vec2 resolution;
                varying vec3 vColor;
                varying float vSize;
                varying float vDistance;

                void main() {
                    // Create circular point sprite with soft edges
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float distance = length(center);
                    if (distance > 0.5) discard;

                    // Soft falloff with atmospheric scintillation
                    float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
                    alpha = pow(alpha, 0.33);

                    // Subtle twinkling effect based on time and position
                    float twinkle = 1.0 + (0.05 * sin(uTime * 2.0 + vDistance * 0.1));

                    // Brightness based on size and distance
                    float brightness = (0.2 * (vSize / 4.0)) * twinkle;

                    // Final color with depth-based dimming
                    vec3 finalColor = vColor * brightness;
                    finalColor *= mix(0.8, 1.0, 1.0 / (1.0 + vDistance * 0.1));

                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.particleSystem.frustumCulled = true;
    this.scene.add(this.particleSystem);

    this.removeEmptyState();

    console.log(`Created star system with ${starCount} stars`);
  }

  getStarColor(colorIndex) {
    // Convert B-V color index to RGB
    // Typical range: -0.4 (blue) to +2.0 (red)
    const bv = Math.max(-0.4, Math.min(2.0, colorIndex));

    let r, g, b;

    if (bv < 0) {
      // Blue stars
      r = 0.7 + bv * 0.5;
      g = 0.7 + bv * 0.3;
      b = 1.0;
    } else if (bv < 0.5) {
      // White stars
      r = 0.85 + bv * 0.1;
      g = 0.85 + bv * 0.1;
      b = 0.85 - bv * 0.3;
    } else if (bv < 1.5) {
      // Yellow to orange stars
      r = 1.0;
      g = 0.9 - (bv - 0.5) * 0.4;
      b = 0.7 - (bv - 0.5) * 0.6;
    } else {
      // Red stars
      r = 1.0;
      g = 0.4 - (bv - 1.5) * 0.4;
      b = 0.6 - (bv - 1.5) * 0.3;
    }

    return { r: Math.max(0, r), g: Math.max(0, g), b: Math.max(0, b) };
  }

  setupControls() {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let rotationX = 0;
    let rotationY = 0;

    this.container.addEventListener("mousedown", (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    this.container.addEventListener("mousemove", (event) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      targetRotationY += deltaX * 0.0015;
      targetRotationX += deltaY * 0.0015;

      targetRotationX = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, targetRotationX)
      );

      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    this.container.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    this.container.addEventListener("mouseleave", () => {
      isMouseDown = false;
    });

    // Wheel zoom
    this.container.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const delta = event.deltaY * 0.001;
        this.targetZoom = Math.max(0, Math.min(6, this.targetZoom + delta));

        // Trigger detailed star loading when zooming in
        if (
          this.targetZoom < 4 &&
          !this.hasDetailedStars &&
          !this.loadingDetailedStars
        ) {
          this.loadDetailedStars();
        }
      },
      { passive: false }
    );

    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        this.targetZoom = Math.max(0, Math.min(6, this.targetZoom + 0.1));
      }
      if (event.key === "ArrowUp") {
        this.targetZoom = Math.max(0, Math.min(6, this.targetZoom - 0.1));
        // Trigger detailed star loading when zooming in with keys
        if (
          this.targetZoom < 4 &&
          !this.hasDetailedStars &&
          !this.loadingDetailedStars
        ) {
          this.loadDetailedStars();
        }
      }

      if (event.key === "ArrowRight") {
        targetRotationY += 0.05;
      }
      if (event.key === "ArrowLeft") {
        targetRotationY -= 0.05;
      }
    });

    // Touch controls for mobile
    let touches = [];
    let lastTouchDistance = 0;

    this.container.addEventListener(
      "touchstart",
      (event) => {
        touches = Array.from(event.touches);
        if (touches.length === 1) {
          mouseX = touches[0].clientX;
          mouseY = touches[0].clientY;
          isMouseDown = true;
        } else if (touches.length === 2) {
          const dx = touches[0].clientX - touches[1].clientX;
          const dy = touches[0].clientY - touches[1].clientY;
          lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        }
      },
      { passive: false }
    );

    this.container.addEventListener("touchmove", (event) => {
      event.preventDefault();
      touches = Array.from(event.touches);

      if (touches.length === 1 && isMouseDown) {
        const deltaX = touches[0].clientX - mouseX;
        const deltaY = touches[0].clientY - mouseY;

        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;

        targetRotationX = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, targetRotationX)
        );

        mouseX = touches[0].clientX;
        mouseY = touches[0].clientY;
      } else if (touches.length === 2) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (lastTouchDistance > 0) {
          const scale = distance / lastTouchDistance;
          this.targetZoom = Math.max(2, Math.min(20, this.targetZoom / scale));

          // Trigger detailed star loading when pinch zooming in
          if (
            this.targetZoom < 4 &&
            !this.hasDetailedStars &&
            !this.loadingDetailedStars
          ) {
            this.loadDetailedStars();
          }
        }
        lastTouchDistance = distance;
      }
    });

    this.container.addEventListener("touchend", () => {
      isMouseDown = false;
      touches = [];
      lastTouchDistance = 0;
    });

    this.container.addEventListener("touchcancel", () => {
      isMouseDown = false;
      touches = [];
      lastTouchDistance = 0;
    });

    this.updateControls = (time) => {
      rotationX += (targetRotationX - rotationX) * 0.1 + time * 0.0001;
      rotationY += (targetRotationY - rotationY) * 0.1 + time * 0.001;
      this.currentZoom += (this.targetZoom - this.currentZoom) * 0.1;
      this.rotationX = rotationX;
      this.rotationY = rotationY;

      if (this.particleSystem) {
        this.particleSystem.rotation.x = rotationX;
        this.particleSystem.rotation.y = rotationY;
      }

      this.camera.position.z = this.currentZoom;
    };
  }

  setupPostProcessing() {
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.chromaticAberrationPass = new ShaderPass(chromaticAberrationShader);
    this.composer.addPass(this.chromaticAberrationPass);

    this.outputPass = new OutputPass(this.renderer);
    this.outputPass.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.composer.addPass(this.outputPass);

    this.filmGrainPass = new ShaderPass(filmGrainShader);
    this.composer.addPass(this.filmGrainPass);

    this.filmPass = new FilmPass(2, false);
    this.composer.addPass(this.filmPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      2.5,
      0.8,
      0.0
    );
    this.composer.addPass(this.bloomPass);
  }

  onWindowResize() {
    this.camera.aspect =
      this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.composer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (this.bokehPass) {
      this.bokehPass.setSize(
        this.container.clientWidth,
        this.container.clientHeight
      );
      this.bokehPass.outputColorSpace = THREE.SRGBColorSpace;
      this.bokehPass.toneMapping = THREE.ACESFilmicToneMapping;
    }

    if (this.bloomPass) {
      this.bloomPass.setSize(
        this.container.clientWidth,
        this.container.clientHeight
      );
      this.bloomPass.outputColorSpace = THREE.SRGBColorSpace;
      this.bloomPass.toneMapping = THREE.ACESFilmicToneMapping;
    }

    if (this.renderPass) {
      this.renderPass.setSize(
        this.container.clientWidth,
        this.container.clientHeight
      );
      this.renderPass.outputColorSpace = THREE.SRGBColorSpace;
      this.renderPass.toneMapping = THREE.ACESFilmicToneMapping;
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    // Update controls
    if (this.updateControls) {
      this.time += 0.01;
      this.updateControls(this.time);
    }

    // Update time uniform for twinkling effect
    if (this.particleSystem && this.particleSystem.material.uniforms) {
      this.particleSystem.material.uniforms.uTime.value += 0.01;
    }

    if (this.filmGrainPass && this.filmGrainPass.material.uniforms) {
      this.filmGrainPass.material.uniforms.uTime.value += 0.01;
    }

    // this.renderer.render(this.scene, this.camera);
    this.composer.render(this.scene, this.camera);
  }
}

// Initialize the star field when the page loads
let starFieldInstance = null;

window.addEventListener("DOMContentLoaded", () => {
  starFieldInstance = new StarField();
});

// Listen for tab changes to reinitialize astronomy demo
document.addEventListener("DOMContentLoaded", () => {
  // Find the astronomy tab panel
  const astronomyPanel = document
    .querySelector("[data-astronomy-canvas-container]")
    ?.closest('[data-tabs="panel"]');

  if (astronomyPanel) {
    // Use MutationObserver to detect when the panel becomes visible
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "hidden"
        ) {
          if (!astronomyPanel.hidden && starFieldInstance) {
            // Tab became visible, reinitialize the demo
            setTimeout(() => {
              starFieldInstance.reinitialize();
            }, 100); // Small delay to ensure DOM is ready
          }
        }
      });
    });

    observer.observe(astronomyPanel, {
      attributes: true,
      attributeFilter: ["hidden"],
    });
  }
});