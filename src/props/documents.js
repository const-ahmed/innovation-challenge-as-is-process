// Shipping paperwork as floating sheets.
import * as THREE from 'three';
import { M, box, prop, castShadows, canvasTex, font } from '../engine/kit.js';

export const DOCS = [
  { id: 'invoice', title: 'Commercial invoice', accent: '#2f5597', mark: '$' },
  { id: 'phyto', title: 'Phytosanitary certificate', accent: '#4e8f6a', mark: '✿' },
  { id: 'lading', title: 'Bill of lading', accent: '#b8483e', mark: '⚓' },
];

export function createDocument({ title, accent, mark }) {
  const { root, body } = prop();
  const tex = canvasTex(260, 340, (g, w, h) => {
    g.fillStyle = '#fbf7f0'; g.fillRect(0, 0, w, h);
    g.fillStyle = accent; g.fillRect(0, 0, w, 54);
    g.fillStyle = '#fbf7f0'; g.font = font(700, 26); g.textBaseline = 'middle';
    const words = title.split(' ');
    if (title.length > 18) { g.font = font(700, 22); g.fillText(words.slice(0, -1).join(' '), 14, 18); g.fillText(words.at(-1), 14, 40); }
    else g.fillText(title, 14, 28);
    g.fillStyle = '#d2c8b8';
    for (let i = 0; i < 8; i++) g.fillRect(16, 80 + i * 24, i % 3 === 2 ? 130 : 220, 8);
    g.strokeStyle = accent; g.lineWidth = 5; g.globalAlpha = .75;
    g.beginPath(); g.arc(196, 284, 34, 0, Math.PI * 2); g.stroke();
    g.fillStyle = accent; g.font = font(700, 34); g.textAlign = 'center'; g.fillText(mark, 196, 286);
    g.globalAlpha = 1; g.strokeStyle = '#1c2236'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(20, 296); g.bezierCurveTo(50, 270, 70, 310, 100, 286); g.bezierCurveTo(115, 276, 120, 300, 140, 290); g.stroke();
  });
  const paper = M('#f4efe6');
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: .9 });
  box(1.1, 1.45, .03, [paper, paper, paper, paper, face, paper], 0, -.725, 0, body);
  castShadows(root);
  root.visible = false;
  return { root, body };
}
