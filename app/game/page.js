import { useEffect, useRef } from "react";

export default function Game() {
  const mountRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let renderer, scene, camera;
    const enemies = [];
    const bullets = [];
    let player;
    let score = 0;
    let scoreEl, footerEl;
    const handlers = [];

    (async () => {
      const THREE = await import("three");

      // scene + camera + renderer
      scene = new THREE.Scene();
      const loader = new THREE.TextureLoader();

      // background texture (from public/background.png)
      try {
        const bg = loader.load("/background.png");
        scene.background = bg;
      } catch (e) {
        // ignore if not present
      }

      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 2, 8);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      mountRef.current.appendChild(renderer.domElement);

      // lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, 0.6);
      dir.position.set(5, 10, 7);
      scene.add(dir);

      // ground (subtle)
      const groundGeo = new THREE.PlaneGeometry(80, 80);
      const groundMat = new THREE.MeshStandardMaterial({ color: 0x071121 });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -2;
      scene.add(ground);

      // player (box)
      const pGeo = new THREE.BoxGeometry(1, 1, 1.5);
      const pMat = new THREE.MeshStandardMaterial({
        color: 0x00d1b2,
        metalness: 0.2,
        roughness: 0.7,
      });
      player = new THREE.Mesh(pGeo, pMat);
      player.position.set(0, -0.5, 0);
      scene.add(player);

      // load logo texture for enemies
      let logoTex = null;
      try {
        logoTex = loader.load("/logo.png");
      } catch (e) {
        logoTex = null;
      }

      // enemy creation using logo texture if available
      const createEnemy = () => {
        const eGeo = new THREE.SphereGeometry(0.6, 24, 24);
        const eMat = logoTex
          ? new THREE.MeshStandardMaterial({ map: logoTex })
          : new THREE.MeshStandardMaterial({ color: 0xff5555 });
        const e = new THREE.Mesh(eGeo, eMat);
        e.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 1 + 0.2, -30 - Math.random() * 40);
        scene.add(e);
        enemies.push(e);
      };

      // spawn some initial enemies
      for (let i = 0; i < 6; i++) createEnemy();

      // DOM score element
      scoreEl = document.createElement("div");
      scoreEl.id = "score";
      Object.assign(scoreEl.style, {
        position: "absolute",
        top: "12px",
        left: "12px",
        color: "white",
        fontSize: "20px",
        fontFamily: "Arial, sans-serif",
        zIndex: 9999,
      });
      scoreEl.innerText = "Score: 0";
      document.body.appendChild(scoreEl);

      // footer with X handle
      footerEl = document.createElement("div");
      Object.assign(footerEl.style, {
        position: "absolute",
        right: "12px",
        bottom: "12px",
        color: "white",
        fontSize: "14px",
        zIndex: 9999,
        fontFamily: "Arial, sans-serif",
      });
      footerEl.innerHTML = `made by <a href="https://x.com/sonuwork37" target="_blank" style="color: #1DA1F2; text-decoration:none;">@sonuwork37</a>`;
      document.body.appendChild(footerEl);

      // controls: left/right
      const keys = { left: false, right: false };
      const keydown = (e) => {
        if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
        if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
      };
      const keyup = (e) => {
        if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
        if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
        // shoot on space
        if (e.key === " " || e.code === "Space") doShoot();
      };
      window.addEventListener("keydown", keydown);
      window.addEventListener("keyup", keyup);
      handlers.push(["keydown", keydown], ["keyup", keyup]);

      // click to shoot
      const clickShoot = () => doShoot();
      window.addEventListener("click", clickShoot);
      handlers.push(["click", clickShoot]);

      // shoot function
      function doShoot() {
        const bGeo = new THREE.BoxGeometry(0.14, 0.14, 0.8);
        const bMat = new THREE.MeshStandardMaterial({ color: 0xfff176 });
        const b = new THREE.Mesh(bGeo, bMat);
        b.position.set(player.position.x, player.position.y, player.position.z - 1.2);
        scene.add(b);
        bullets.push(b);
      }

      // resize
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);
      handlers.push(["resize", onResize]);

      // animation loop
      const clock = new THREE.Clock();
      function animate() {
        if (!mounted) return;
        requestAnimationFrame(animate);
        const dt = Math.min(0.05, clock.getDelta());

        // player move
        if (keys.left) player.position.x -= 6 * dt;
        if (keys.right) player.position.x += 6 * dt;
        player.position.x = Math.max(-4, Math.min(4, player.position.x));

        // move bullets forward (towards negative z)
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.position.z -= 40 * dt;
          if (b.position.z < -200) {
            scene.remove(b);
            bullets.splice(i, 1);
          }
        }

        // move enemies toward player (increase z)
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.position.z += 8 * dt;
          // if enemy passes player -> game over
          if (e.position.z >= player.position.z + 0.8) {
            // GAME OVER
            alert("OUT! Game Over. Score: " + score);
            window.location.reload();
            return;
          }
        }

        // collision detection: bullet <-> enemy
        for (let i = enemies.length - 1; i >= 0; i--) {
          for (let j = bullets.length - 1; j >= 0; j--) {
            const e = enemies[i];
            const b = bullets[j];
            if (!e || !b) continue;
            const dist = e.position.distanceTo(b.position);
            if (dist < 0.9) {
              // hit
              scene.remove(e);
              scene.remove(b);
              enemies.splice(i, 1);
              bullets.splice(j, 1);

              // add score + respawn
              score += 10;
              if (scoreEl) scoreEl.innerText = "Score: " + score;
              // respawn one enemy
              createEnemy();
              break;
            }
          }
        }

        // occasionally spawn more enemies
        if (Math.random() < 0.01) createEnemy();

        renderer.render(scene, camera);
      }
      animate();
    })();

    // cleanup on unmount
    return () => {
      mounted = false;
      // remove renderer dom
      try {
        if (mountRef.current) {
          while (mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
          }
        }
      } catch (e) {}
      // remove appended DOM elements
      if (scoreEl && scoreEl.parentNode) scoreEl.parentNode.removeChild(scoreEl);
      if (footerEl && footerEl.parentNode) footerEl.parentNode.removeChild(footerEl);
      // remove event listeners we added
      for (let i = 0; i < handlers.length; i++) {
        const [name, fn] = handlers[i];
        window.removeEventListener(name, fn);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} />;
}
EOF
