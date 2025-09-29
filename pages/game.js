// pages/game.js
import { useEffect, useRef } from "react";

export default function Game() {
  const mountRef = useRef(null);

  useEffect(() => {
    let renderer, scene, camera, player, enemies = [], bullets = [];
    let mounted = true;

    // dynamic import of three to be safe with SSR
    (async () => {
      const THREE = await import("three");

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111217);

      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 1.5, 6);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
      mountRef.current.appendChild(renderer.domElement);

      // simple ambient + directional light
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, 0.6);
      dir.position.set(5, 10, 7);
      scene.add(dir);

      // ground
      const groundGeo = new THREE.PlaneGeometry(50, 50);
      const groundMat = new THREE.MeshStandardMaterial({ color: 0x0f1720 });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1;
      scene.add(ground);

      // player (stylized box)
      const pGeo = new THREE.BoxGeometry(0.8, 0.8, 1);
      const pMat = new THREE.MeshStandardMaterial({ color: 0x00d1b2, metalness: 0.3, roughness: 0.6 });
      player = new THREE.Mesh(pGeo, pMat);
      player.position.set(0, 0.0, 0);
      scene.add(player);

      // spawn initial enemies
      function spawnEnemy() {
        const eGeo = new THREE.SphereGeometry(0.4, 12, 12);
        const eMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
        const e = new THREE.Mesh(eGeo, eMat);
        e.position.set((Math.random() - 0.5) * 8, 0.2, -20 - Math.random() * 20);
        scene.add(e);
        enemies.push(e);
      }
      for (let i = 0; i < 6; i++) spawnEnemy();

      // handle resize
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      // shoot on click
      const onClick = () => {
        const bGeo = new THREE.BoxGeometry(0.12, 0.12, 0.6);
        const bMat = new THREE.MeshStandardMaterial({ color: 0xfff176 });
        const b = new THREE.Mesh(bGeo, bMat);
        b.position.copy(player.position);
        b.position.z -= 1;
        scene.add(b);
        bullets.push(b);
      };
      window.addEventListener("click", onClick);

      // simple controls: left-right with arrow keys / a d
      const keys = { left:false, right:false };
      const onKey = (e) => {
        if (e.key === "ArrowLeft" || e.key === "a") keys.left = e.type === "keydown";
        if (e.key === "ArrowRight" || e.key === "d") keys.right = e.type === "keydown";
      };
      window.addEventListener("keydown", onKey);
      window.addEventListener("keyup", onKey);

      // animation loop
      const clock = new THREE.Clock();
      function animate() {
        if (!mounted) return;
        requestAnimationFrame(animate);
        const dt = clock.getDelta();

        // player movement
        if (keys.left) player.position.x -= 6 * dt;
        if (keys.right) player.position.x += 6 * dt;
        player.position.x = Math.max(-4, Math.min(4, player.position.x));

        // bullets forward
        for (let i = bullets.length - 1; i >= 0; i--) {
          bullets[i].position.z -= 30 * dt;
          if (bullets[i].position.z < -80) {
            scene.remove(bullets[i]);
            bullets.splice(i, 1);
          }
        }

        // enemies move toward player
        for (let i = enemies.length - 1; i >= 0; i--) {
          enemies[i].position.z += 6 * dt;
          if (enemies[i].position.z > 10) {
            // reset enemy back
            enemies[i].position.z = -20 - Math.random() * 20;
            enemies[i].position.x = (Math.random() - 0.5) * 8;
          }
        }

        // simple collision bullet <-> enemy
        for (let i = enemies.length - 1; i >= 0; i--) {
          for (let j = bullets.length - 1; j >= 0; j--) {
            const dist = enemies[i].position.distanceTo(bullets[j].position);
            if (dist < 0.6) {
              // hit
              scene.remove(enemies[i]);
              scene.remove(bullets[j]);
              enemies.splice(i, 1);
              bullets.splice(j, 1);
              // respawn new enemy
              spawnEnemy();
              break;
            }
          }
        }

        renderer.render(scene, camera);
      }
      animate();
    })();

    // cleanup on unmount
    return () => {
      mounted = false;
      try {
        while (mountRef.current && mountRef.current.firstChild) {
          mountRef.current.removeChild(mountRef.current.firstChild);
        }
      } catch (e) {}
      window.removeEventListener("resize", () => {});
      window.removeEventListener("click", () => {});
      window.removeEventListener("keydown", () => {});
      window.removeEventListener("keyup", () => {});
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} />;
}
