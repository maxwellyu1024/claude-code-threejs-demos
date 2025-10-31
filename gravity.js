import * as THREE from "three";

const textureSize = 256;

class EmojiPhysicsDemo {
    constructor() {
        this.container = document.querySelector(
            "[data-gravity-canvas-container]",
        );
        this.emptyState = document.querySelector(
            "[data-gravity-empty-state]",
        );

        this.emojiIndex = 0;
        this.emojiChars = [
            "😀",
            "😍",
            "😝",
            "🤨",
            "😵",
            "😎",
            "😵‍💫",
        ];
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.emojis = [];
        this.mouse = { x: 0, y: 0 };
        this.maxEmojis = 500;
        this.isMouseDown = false;
        this.spawnInterval = null;
        this.walls = [];
        this.emojiSize = 1;
        this.emoji = this.emojiChars[this.emojiIndex];
        this.gravityY = -10;
        this.gravityX = 2;
        this.emptyStateVisible = true;
        this.isInitialized = false;
        this.animationId = null;

        this.emojiTypes = {};
        this.emojiTypeOrder = [];

        this.init();
    }

    init() {
        // Check if container is visible before initializing
        if (
            this.container.offsetWidth === 0 ||
            this.container.offsetHeight === 0
        ) {
            // Container is hidden, wait for it to become visible
            this.waitForVisibility();
            return;
        }

        const ww = this.container.clientWidth;

        this.emojiSize = ww < 800 ? 1.35 : 1.25;

        this.scene = new THREE.Scene();

        const aspect =
            this.container.clientWidth /
            this.container.clientHeight;
        const frustumSize = 20;

        this.camera = new THREE.OrthographicCamera(
            (-frustumSize * aspect) / 2,
            (frustumSize * aspect) / 2,
            frustumSize / 2,
            -frustumSize / 2,
            0.1,
            1000,
        );
        this.camera.position.z = 10;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        this.renderer.setSize(
            this.container.clientWidth,
            this.container.clientHeight,
        );
        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2),
        );
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.domElement.id = "emoji-gravity-canvas";
        this.container?.appendChild(this.renderer.domElement);

        // Physics
        this.world = new CANNON.World();
        this.world.gravity.set(this.gravityX, this.gravityY, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.defaultContactMaterial.friction = 0.001;
        this.world.defaultContactMaterial.restitution = 0.2;

        this.createWalls();

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambientLight);

        this.setupEmojiTextures();

        this.setupEmoji(this.emoji);

        // Now that renderer is created, set up event listeners and start animation
        this.setupEventListeners();
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
            const existingCanvas =
                this.container.querySelector("canvas");
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
                    child.material.forEach((material) =>
                        material.dispose(),
                    );
                } else {
                    child.material.dispose();
                }
            }
        }

        // Dispose of renderer
        if (this.renderer) {
            this.renderer.dispose();
        }

        // Reset physics world
        if (this.world) {
            this.world.bodies.forEach((body) => {
                this.world.removeBody(body);
            });
        }

        // Reset references
        this.emojis = [];
        this.walls = [];
        this.emojiTypes = {};
        this.emojiTypeOrder = [];
    }

    createWalls() {
        const aspect =
            this.container.clientWidth /
            this.container.clientHeight;
        const frustumSize = 20;
        const width = frustumSize * aspect;
        const height = frustumSize;
        const wallThickness = 2;

        this.walls.forEach((wall) => this.world.removeBody(wall));
        this.walls = [];

        const bottomWall = new CANNON.Body({ mass: 0 });
        bottomWall.addShape(
            new CANNON.Box(
                new CANNON.Vec3(width / 2, wallThickness / 2, 1),
            ),
        );
        bottomWall.position.set(
            0,
            -height / 2 - wallThickness / 2,
            0,
        );
        this.world.addBody(bottomWall);
        this.walls.push(bottomWall);

        const topWall = new CANNON.Body({ mass: 0 });
        topWall.addShape(
            new CANNON.Box(
                new CANNON.Vec3(width / 2, wallThickness / 2, 1),
            ),
        );
        topWall.position.set(0, height / 2 + wallThickness / 2, 0);
        this.world.addBody(topWall);
        this.walls.push(topWall);

        const leftWall = new CANNON.Body({ mass: 0 });
        leftWall.addShape(
            new CANNON.Box(
                new CANNON.Vec3(wallThickness / 2, height / 2, 1),
            ),
        );
        leftWall.position.set(-width / 2 - wallThickness / 2, 0, 0);
        this.world.addBody(leftWall);
        this.walls.push(leftWall);

        const rightWall = new CANNON.Body({ mass: 0 });
        rightWall.addShape(
            new CANNON.Box(
                new CANNON.Vec3(wallThickness / 2, height / 2, 1),
            ),
        );
        rightWall.position.set(width / 2 + wallThickness / 2, 0, 0);
        this.world.addBody(rightWall);
        this.walls.push(rightWall);
    }

    createEmojiTexture(emoji) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = textureSize;
        canvas.height = textureSize;

        context.clearRect(0, 0, textureSize, textureSize);

        context.font = "96px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(emoji, textureSize / 2, textureSize / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createInstancedMeshForEmojiType(emoji) {
        const geometry = new THREE.CircleGeometry(
            this.emojiSize,
            textureSize,
        );
        const texture = this.emojiTypes[emoji].texture;
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
        });

        const instancedMesh = new THREE.InstancedMesh(
            geometry,
            material,
            this.maxEmojis,
        );
        instancedMesh.instanceMatrix.setUsage(
            THREE.DynamicDrawUsage,
        );
        this.scene.add(instancedMesh);

        // Initially hide all instances
        const matrix = new THREE.Matrix4();
        matrix.makeScale(0, 0, 0); // Scale to 0 to hide
        for (let i = 0; i < this.maxEmojis; i++) {
            instancedMesh.setMatrixAt(i, matrix);
        }
        instancedMesh.instanceMatrix.needsUpdate = true;

        // Store geometry and material for cleanup if needed
        this.emojiTypes[emoji].geometry = geometry;
        this.emojiTypes[emoji].material = material;

        return instancedMesh;
    }

    setupEmoji(emoji) {
        if (!this.emojiTypes[emoji]) {
            const texture = this.createEmojiTexture(emoji);
            this.emojiTypes[emoji] = {
                texture,
                instancedMesh: null,
                geometry: null,
                material: null,
                count: 0,
            };
            this.emojiTypes[emoji].instancedMesh =
                this.createInstancedMeshForEmojiType(emoji);
            this.emojiTypeOrder.push(emoji);
        }
    }

    createEmoji(x, y, velocityX = 0, velocityY = 0) {
        if (this.emojis.length >= this.maxEmojis) {
            this.removeOldestEmoji();
        }

        this.setupEmoji(this.emojiChars[this.emojiIndex]);

        const emojiType =
            this.emojiTypes[this.emojiChars[this.emojiIndex]];
        const instanceIndex = emojiType.count;

        const body = new CANNON.Body({
            mass: 0.5 + Math.random() * 1,
            material: new CANNON.Material({
                friction: 0.02,
                restitution: 0.0,
            }),
        });
        body.addShape(new CANNON.Sphere(this.emojiSize * 0.38));
        body.position.set(x, y, 0);

        // Individual randomized velocity
        const randomX = (Math.random() - 0.5) * 0.4;
        const randomY = (Math.random() - 0.5) * 0.2;

        body.velocity.set(
            velocityX + randomX,
            velocityY + randomY,
            0,
        );

        const speed = Math.sqrt(
            velocityX * velocityX + velocityY * velocityY,
        );
        body.angularVelocity.set(
            0,
            0,
            speed * 0.5 * (Math.random() - 0.5) * 2,
        );

        body.linearDamping = 0.01;
        body.angularDamping = 0.02;

        this.world.addBody(body);

        const emojiObj = {
            body,
            instanceIndex,
            emojiType: this.emojiChars[this.emojiIndex],
        };
        this.emojis.push(emojiObj);

        const matrix = new THREE.Matrix4();

        matrix.makeTranslation(x, y, 0);
        emojiType.instancedMesh.setMatrixAt(instanceIndex, matrix);
        emojiType.instancedMesh.instanceMatrix.needsUpdate = true;

        emojiType.count++;

        this.updateEmojiCount();
    }

    setupEmojiTextures() {
        this.emojiChars.forEach((emoji) => {
            this.setupEmoji(emoji);
        });
    }

    createEmojiFountain(x, y, continuous = false) {
        const emojiCount = continuous
            ? 3
            : 8 + Math.floor(Math.random() * 7);
        const fountainForce = 4;

        for (let i = 0; i < emojiCount; i++) {
            const angle = Math.random() * Math.PI * 2;

            const distance =
                Math.random() * (continuous ? 0.5 : 1.0);
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;

            const velocityMagnitude =
                fountainForce * (0.5 + Math.random() * 0.5);
            const velocityAngle =
                angle + (Math.random() - 0.5) * 0.3;
            const velocityX =
                Math.cos(velocityAngle) * velocityMagnitude;
            const velocityY =
                Math.sin(velocityAngle) * velocityMagnitude +
                Math.random() * 2;

            const delay = continuous ? i * 10 : i * 20;
            setTimeout(() => {
                this.emojiIndex =
                    (this.emojiIndex + 1) % this.emojiChars.length;
                this.createEmoji(
                    x + offsetX,
                    y + offsetY,
                    velocityX,
                    velocityY,
                );
            }, delay);
        }
    }

    startContinuousSpawning() {
        if (this.spawnInterval) return;

        this.spawnInterval = setInterval(() => {
            if (this.isMouseDown) {
                this.createEmojiFountain(
                    this.mouse.x,
                    this.mouse.y,
                    true,
                );
            }
        }, 80);
    }

    stopContinuousSpawning() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
    }

    removeOldestEmoji() {
        if (this.emojis.length === 0) return;

        const emojiObj = this.emojis.shift();
        this.world.removeBody(emojiObj.body);

        const emojiType = this.emojiTypes[emojiObj.emojiType];
        const matrix = new THREE.Matrix4();
        matrix.makeScale(0, 0, 0);
        emojiType.instancedMesh.setMatrixAt(
            emojiObj.instanceIndex,
            matrix,
        );
        emojiType.instancedMesh.instanceMatrix.needsUpdate = true;

        let typeCount = 0;
        for (let i = 0; i < this.emojis.length; i++) {
            if (this.emojis[i].emojiType === emojiObj.emojiType) {
                this.emojis[i].instanceIndex = typeCount;
                typeCount++;
            }
        }
        emojiType.count = typeCount;

        this.updateEmojiCount();
    }

    updateEmojiCount() {
        // const clearButton = document.querySelector('[data-clear-emojis]');

        // if (this.emojis.length === 0) {
        //     clearButton.disabled = true;
        // } else {
        //     clearButton.disabled = false;
        // }

        const counter = document.getElementById("emojiCount");
        if (counter) {
            counter.textContent = this.emojis.length;
        }
    }

    screenToWorld(screenX, screenY) {
        // Get the bounding rect of the container to get offset within the page
        const rect = this.container.getBoundingClientRect();
        const aspect =
            this.container.clientWidth /
            this.container.clientHeight;
        const frustumSize = 20;

        // Calculate mouse position relative to the container
        const localX = screenX - rect.left;
        const localY = screenY - rect.top;

        const x =
            ((localX / this.container.clientWidth) * 2 - 1) *
            ((frustumSize * aspect) / 2);
        const y =
            (-(localY / this.container.clientHeight) * 2 + 1) *
            (frustumSize / 2);

        return { x, y };
    }

    removeEmptyState() {
        this.emptyStateVisible = false;

        gsap.to(this.emptyState, {
            opacity: 0,
            scale: 0.95,
            ease: "expo.out",
            duration: 0.65,
            onComplete: () => {
                this.emptyState.remove();
            },
        });
    }

    clearEmojis() {
        this.emojis.forEach((emoji) =>
            this.world.removeBody(emoji.body),
        );

        this.emojis = [];
        this.updateEmojiCount();
    }

    setupEventListeners() {
        const canvas = this.renderer.domElement;

        canvas.addEventListener("touchstart", (event) => {
            this.removeEmptyState();
            const worldPos = this.screenToWorld(
                event.touches[0].clientX,
                event.touches[0].clientY,
            );
            this.mouse.x = worldPos.x;
            this.mouse.y = worldPos.y;
            this.isMouseDown = true;

            this.createEmojiFountain(worldPos.x, worldPos.y);

            this.startContinuousSpawning();
        });

        canvas.addEventListener("touchmove", (event) => {
            const worldPos = this.screenToWorld(
                event.touches[0].clientX,
                event.touches[0].clientY,
            );
            this.mouse.x = worldPos.x;
            this.mouse.y = worldPos.y;
        });

        canvas.addEventListener("touchend", () => {
            this.isMouseDown = false;
            this.stopContinuousSpawning();
        });

        canvas.addEventListener("touchleave", () => {
            this.isMouseDown = false;
            this.stopContinuousSpawning();
        });

        canvas.addEventListener("touchcancel", () => {
            this.isMouseDown = false;
            this.stopContinuousSpawning();
        });

        canvas.addEventListener("mousedown", (event) => {
            this.removeEmptyState();
            const worldPos = this.screenToWorld(
                event.clientX,
                event.clientY,
            );
            this.mouse.x = worldPos.x;
            this.mouse.y = worldPos.y;
            this.isMouseDown = true;

            this.createEmojiFountain(worldPos.x, worldPos.y);

            this.startContinuousSpawning();
        });

        canvas.addEventListener("mouseup", () => {
            this.isMouseDown = false;
            this.stopContinuousSpawning();
        });

        canvas.addEventListener("mouseleave", () => {
            this.isMouseDown = false;
            this.stopContinuousSpawning();
        });

        canvas.addEventListener("mousemove", (event) => {
            const worldPos = this.screenToWorld(
                event.clientX,
                event.clientY,
            );
            this.mouse.x = worldPos.x;
            this.mouse.y = worldPos.y;
        });

        window.addEventListener("resize", () => {
            const aspect =
                this.container.clientWidth /
                this.container.clientHeight;
            const frustumSize = 20;

            this.camera.left = (-frustumSize * aspect) / 2;
            this.camera.right = (frustumSize * aspect) / 2;
            this.camera.top = frustumSize / 2;
            this.camera.bottom = -frustumSize / 2;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(
                this.container.clientWidth,
                this.container.clientHeight,
            );

            this.createWalls();
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(
            this.animate.bind(this),
        );

        this.world.step(1 / 60, 0, 6);

        for (const emoji of this.emojiTypeOrder) {
            const emojiType = this.emojiTypes[emoji];
            if (!emojiType) continue;
            const instancedMesh = emojiType.instancedMesh;
            let typeIndex = 0;
            const matrix = new THREE.Matrix4();
            const rotMatrix = new THREE.Matrix4();

            for (let i = 0; i < this.emojis.length; i++) {
                const emojiObj = this.emojis[i];
                if (emojiObj.emojiType !== emoji) continue;

                emojiObj.body.position.z = 0;
                emojiObj.body.velocity.z = 0;
                emojiObj.body.angularVelocity.x = 0;
                emojiObj.body.angularVelocity.y = 0;

                const rotation =
                    emojiObj.body.quaternion.toAxisAngle()[1];
                matrix.makeTranslation(
                    emojiObj.body.position.x,
                    emojiObj.body.position.y,
                    0,
                );
                rotMatrix.makeRotationZ(rotation);
                matrix.multiply(rotMatrix);

                instancedMesh.setMatrixAt(typeIndex, matrix);
                typeIndex++;
            }

            // Cleanup
            for (let i = typeIndex; i < this.maxEmojis; i++) {
                const hideMatrix = new THREE.Matrix4();
                hideMatrix.makeScale(0, 0, 0);
                instancedMesh.setMatrixAt(i, hideMatrix);
            }

            if (emojiType.count > 0) {
                instancedMesh.instanceMatrix.needsUpdate = true;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the demo when the page loads
let gravityDemoInstance = null;

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, initializing demo...");

    // Check if Three.js and Cannon.js are loaded
    if (typeof THREE === "undefined") {
        console.error("Three.js not loaded!");
        return;
    }

    if (typeof CANNON === "undefined") {
        console.error("Cannon.js not loaded!");
        return;
    }

    gravityDemoInstance = new EmojiPhysicsDemo();
});

// Listen for tab changes to reinitialize gravity demo
document.addEventListener("DOMContentLoaded", () => {
    // Find the gravity tab panel
    const gravityPanel = document
        .querySelector("[data-gravity-canvas-container]")
        ?.closest('[data-tabs="panel"]');

    if (gravityPanel) {
        // Use MutationObserver to detect when the panel becomes visible
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "hidden"
                ) {
                    if (
                        !gravityPanel.hidden &&
                        gravityDemoInstance
                    ) {
                        // Tab became visible, reinitialize the demo
                        setTimeout(() => {
                            gravityDemoInstance.reinitialize();
                        }, 100); // Small delay to ensure DOM is ready
                    }
                }
            });
        });

        observer.observe(gravityPanel, {
            attributes: true,
            attributeFilter: ["hidden"],
        });
    }
});
