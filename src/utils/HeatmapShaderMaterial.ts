export const getRiskColor = (score: number) => {
  if (score > 80) return '#ef4444'; // Red
  if (score > 50) return '#f59e0b'; // Amber
  return '#10b981'; // Green
};

// Simple shader placeholder for now
export const HeatmapShaderMaterial = {
  uniforms: {
    time: { value: 0 },
  },
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `
};
