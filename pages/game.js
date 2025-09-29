import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Game() {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x20232a);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Player (cube)
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(geometry, material);
    scene.add(player);

    // Enemies
    const enemies = [];
    for (let i = 0; i < 5; i++) {
      const enemyGeo = new THREE.SphereGeometry(0.5, 16, 16);
      const enemyMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const enemy = new THREE.Mesh(enemyGeo, enemyMat);
      enemy.position.set(Math.random() * 6 - 3, Math.random() * 4 - 2, -10);
      scene.add(enemy);
      enemies.push(enemy);
    }

    // Bullets
    const bullets = [];

    function shoot() {
      const bulletGeo = new THREE.BoxGeometry(0.1, 0.1, 0.5);
      const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const bullet = new THREE.Mesh(bulletGeo, bulletMat);
      bullet.position.set(player.position.x, player.position.y, player.position.z - 1);
      scene.add(bullet);
      bullets.push(bullet);
    }

    window.addEventListener("click", shoot);

    function animate() {
      requestAnimationFrame(animate);

      // Move bullets
      bullets.forEach((b, i) => {
        b.position.z -= 0.2;
        if (b.position.z < -20) {
          scene.remove(b);
          bullets.splice(i, 1);
        }
      });

      // Move enemies
      enemies.forEach((e) => {
        e.position.z += 0.05;
        if (e.position.z > 5) {
          e.position.z = -10;
          e.position.x = Math.random() * 6 - 3;
        }
      });

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener("click", shoot);
    };
  }, []);

  return <div ref={mountRef} />;
}
