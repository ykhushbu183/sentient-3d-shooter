import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Simple 3D shooter using raw Three.js.
 * - left/right: ArrowLeft / ArrowRight / a / d
 * - shoot: mouse click or spacebar
 *
 * This is a placeholder engine: later you can replace the player box
 * with a GLTF dog model (see GLTFLoader snippet below).
 */
export default function Game() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071025);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2.0, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0x081018 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    scene.add(ground);

    // player (placeholder box). Replace with GLTF dog model later if you have it.
    const playerMat = new THREE.MeshStandardMaterial({ color: 0x00d1b2 });
    const player = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1), playerMat);
    player.position.set(0, 0, 2);
    scene.add(player);

    // arrays
    const bullets = [];
    const enemies = [];

    function spawnEnemy() {
      const geo = new THREE.SphereGeometry(0.45, 12, 12);
      const mat = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
      const e = new THREE.Mesh(geo, mat);
      e.position.set((Math.random() - 0.5) * 8, 0, -30 - Math.random() * 20);
      scene.add(e);
      enemies.push(e);
    }
    for (let i = 0; i < 6; i++) spawnEnemy();

    // controls
    const keys = { left: false, right: false };
    function onKeyDown(e) {
      if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
      if (e.key === " ") shoot();
    }
    function onKeyUp(e) {
      if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function shoot() {
      const geo = new THREE.BoxGeometry(0.12, 0.12, 0.6);
      const mat = new THREE.MeshStandardMaterial({ color: 0xfff176 });
      const b = new THREE.Mesh(geo, mat);
      b.position.set(player.position.x, 0, player.position.z - 1);
      scene.add(b);
      bullets.push(b);
    }
    window.addEventListener("click", shoot);

    // animation loop
    const clock = new THREE.Clock();
    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      // player movement
      if (keys.left) player.position.x -= 6 * dt;
      if (keys.right) player.position.x += 6 * dt;
      player.position.x = Math.max(-4, Math.min(4, player.position.x));

      // bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.position.z -= 30 * dt;
        if (b.position.z < -120) {
          scene.remove(b);
          disposeMesh(b);
          bullets.splice(i, 1);
        }
      }

      // enemies movement
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.position.z += 6 * dt;
        if (e.position.z > 10) {
          e.position.z = -30 - Math.random() * 20;
          e.position.x = (Math.random() - 0.5) * 8;
        }
      }

      // collisions
      for (let i = enemies.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
          if (enemies[i].position.distanceTo(bullets[j].position) < 0.6) {
            // destroy both
            scene.remove(enemies[i]);
            disposeMesh(enemies[i]);
            enemies.splice(i, 1);

            scene.remove(bullets[j]);
            disposeMesh(bullets[j]);
            bullets.splice(j, 1);

            spawnEnemy();
            break;
          }
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    // resize
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    function disposeMesh(m) {
      if (!m) return;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose());
        else m.material.dispose();
      }
    }

    // cleanup on unmount
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("click", shoot);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      while (mount.firstChild) mount.removeChild(mount.firstChild);
      bullets.forEach(disposeMesh);
      enemies.forEach(disposeMesh);
      disposeMesh(player);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} />;
}
