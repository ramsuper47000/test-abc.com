import { useRef, useEffect, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RiskScore } from '../utils/correlationEngine';
import { getRiskColor } from '../utils/HeatmapShaderMaterial';
import { latLonToVector3Object } from '../utils/geoToPosition';

interface GlobeProps {
  riskPoints?: Array<{
    lat: number;
    lng: number;
    risk: RiskScore;
    data: unknown;
  }>;
  onPointClick?: (lat: number, lng: number, data: unknown) => void;
  maxNodes?: number;
}

const GlobeInner = memo(function GlobeInner({
  riskPoints = [],
  maxNodes = 50,
}: GlobeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowsRef = useRef<THREE.Group>(null);

  const atmosphereRef = useRef<THREE.Mesh>(null);
  
  const limitedRiskPoints = useMemo(() => {
    return riskPoints.slice(0, maxNodes);
  }, [riskPoints, maxNodes]);

  useEffect(() => {
    if (!groupRef.current) return;
    const currentGroup = groupRef.current;

    try {
      currentGroup.clear();

      const earthGeometry = new THREE.IcosahedronGeometry(1, 6);
      const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        emissive: 0x050505,
        shininess: 20,
        wireframe: false,
      });

      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      currentGroup.add(earth);

      const wireframeGeometry = new THREE.IcosahedronGeometry(1.005, 6);
      const wireframeMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        wireframe: true,
        emissive: 0x222222,
        transparent: true,
        opacity: 0.1,
        linewidth: 1,
      });

      const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
      currentGroup.add(wireframe);

      const atmosphereGeometry = new THREE.IcosahedronGeometry(1.08, 6);
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.03,
        side: THREE.BackSide,
        emissive: 0x111111,
      });

      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      atmosphereRef.current = atmosphere;
      currentGroup.add(atmosphere);

      const gaugeLinesGeometry = new THREE.BufferGeometry();
      const gaugeLinePositions: number[] = [];

      for (let i = 0; i < 180; i += 30) {
        const rad = (i * Math.PI) / 180;
        gaugeLinePositions.push(
          Math.cos(rad) * 1.02,
          Math.sin(rad) * 1.02,
          0,
          Math.cos(rad) * 1.05,
          Math.sin(rad) * 1.05,
          0
        );
      }

      gaugeLinesGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(gaugeLinePositions), 3)
      );

      const gaugeLinesMatera = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        linewidth: 1,
      });

      const gaugeLines = new THREE.LineSegments(gaugeLinesGeometry, gaugeLinesMatera);
      currentGroup.add(gaugeLines);

      const glowsGroup = new THREE.Group();
      glowsRef.current = glowsGroup;
      currentGroup.add(glowsGroup);
    } catch (error) {
      console.error('Error creating globe geometry:', error);
    }

    return () => {
      if (currentGroup) {
        currentGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, []);

  useEffect(() => {
    if (!glowsRef.current) return;

    try {
      glowsRef.current.clear();

      limitedRiskPoints.forEach((point) => {
        try {
          const position = latLonToVector3Object(point.lat, point.lng, 1);

          const scale = 0.01 + (point.risk.intensity * 0.03);
          const geometry = new THREE.SphereGeometry(scale, 16, 16);

          const color = getRiskColor(point.risk.score);
          const material = new THREE.MeshBasicMaterial({
            color,
            emissive: color,
            emissiveIntensity: 1.2,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.copy(position);
          mesh.userData = { ...point, id: point.risk.eventId };

          const glowGeometry = new THREE.SphereGeometry(scale * 1.8, 16, 16);
          const glowMaterial = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.15,
            emissive: color,
            emissiveIntensity: 0.6,
          });

          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
          glow.position.copy(position);

          const group = new THREE.Group();
          group.add(mesh);
          group.add(glow);
          group.userData = { id: point.risk.eventId, data: point };

          glowsRef.current!.add(group);
        } catch (error) {
          console.error('Error creating risk point:', error);
        }
      });
    } catch (error) {
      console.error('Error updating risk points:', error);
    }
  }, [limitedRiskPoints]);

  useFrame(({ clock }) => {
    try {
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.00005;
      }

      if (atmosphereRef.current) {
        const mat = atmosphereRef.current.material as THREE.MeshPhongMaterial;
        mat.opacity = 0.08 + Math.sin(clock.getElapsedTime() * 0.5) * 0.04;
      }

      if (glowsRef.current) {
        glowsRef.current.children.forEach((group) => {
          const glow = group.children[1] as THREE.Mesh;
          if (glow && glow.material instanceof THREE.MeshBasicMaterial) {
            const intensity = 0.15 + Math.sin(clock.getElapsedTime() * 2 + Math.random()) * 0.1;
            glow.material.opacity = intensity;
          }
        });
      }
    } catch (error) {
      console.error('Error in animation frame:', error);
    }
  });

  return <group ref={groupRef} />;
});

export default GlobeInner;
