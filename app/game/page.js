"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Game() {
  const mountRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();

    // Background with Sentient text
    const loader = new THREE.TextureLoader();
    const bgTexture = loader.load("/sentient-bg.png"); // banalo ek image jisme Sentient likha ho
    scene.background = bgTexture;

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

    // Shooter (Dog Logo)
    const dogTexture = loader.load("/dog.png");
    const shooterMaterial = new THREE.SpriteMaterial({ map: dogTexture });
    const shooter = new THREE.Sprite(shooterMaterial);
    shooter.scale.set(1, 1, 1);
    scene.add(shooter);

    // Bullets
    const bullets = [];
    const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    const onKeyDown = (event) => {
      if (gameOver) return;

      if (event.key === " ") {
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.set(shooter.position.x, shooter.position.y, shooter.position.z);
        bullets.push(bullet);
        scene.add(bullet);
      }
      if (event.key === "ArrowLeft") shooter.position.x -= 0.2;
      if (event.key === "ArrowRight") shooter.position.x += 0.2;
    };
    window.addEventListener("keydown", onKeyDown);

    // Enemy balls with Sentient logo
    const sentientTexture = loader.load("/sentient-logo.png");
    const enemyMaterial = new THREE.SpriteMaterial({ map: sentientTexture });

    const enemies = [];
    const spawnEnemy = () => {
      const enemy = new THREE.Sprite(enemyMaterial);
      enemy.scale.set(0.7, 0.7, 0.7);
      enemy.position.set((Math.random() - 0.5) * 6, 0, -10);
      enemies.push(enemy);
      scene.add(enemy);
    };
    const enemyInterval = setInterval(spawnEnemy, 1500);

    // Animation loop
    const animate = () => {
      if (gameOver) return;
      requestAnimationFrame(animate);

      bullets.forEach((bullet, index) => {
        bullet.position.z -= 0.2;
        enemies.forEach((enemy, eIndex) => {
          if (bullet.position.distanceTo(enemy.position) < 0.5) {
            scene.remove(enemy);
            enemies.splice(eIndex, 1);
            scene.remove(bullet);
            bullets.splice(index, 1);
            setScore((s) => s + 10);
          }
        });
      });

      enemies.forEach((enemy) => {
        enemy.position.z += 0.05;

        // collision with shooter → game over
        if (enemy.position.distanceTo(shooter.position) < 0.5) {
          setGameOver(true);
          clearInterval(enemyInterval);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      clearInterval(enemyInterval);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [gameOver]);

  return (
    <div>
      <div ref={mountRef} />
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          color: "white",
          fontSize: "20px",
          fontFamily: "monospace",
        }}
      >
        Score: {score}
      </div>
      {gameOver && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "40px",
            color: "red",
            fontWeight: "bold",
          }}
        >
          Game Over
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          color: "white",
          fontSize: "16px",
        }}
      >
        Made by{" "}
        <a
          href="https://x.com/sonuwork37"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1DA1F2" }}
        >
          @sonuwork37
        </a>
      </div>
    </div>
  );
}
