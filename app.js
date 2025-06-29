// app.js

// Note: Include this script as a module in your HTML:
// <script type="module" src="app.js"></script>

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.148.0/examples/jsm/loaders/GLTFLoader.js';

document.addEventListener('DOMContentLoaded', () => {
  const numAislesInput = document.getElementById('numAisles');
  const generateBtn    = document.getElementById('generate-btn');

  renderForm(+numAislesInput.value);
  numAislesInput.addEventListener('input', () => renderForm(+numAislesInput.value));

  generateBtn.addEventListener('click', () => {
    const cfg = parseForm();
    if (!cfg.aisles || !cfg.aisles.length) return;
    buildScene(cfg);
  });
});

function renderForm(aisleCount) {
  const form = document.getElementById('config-form');
  form.innerHTML = '';
  for (let i = 1; i <= aisleCount; i++) {
    const card = document.createElement('details');
    card.className = 'card'; card.open = true;
    card.innerHTML = `
      <summary>Aisle ${i}</summary>
      <label>Width (m):      <input name="aisle${i}Width"  type="number" value="4"  step="0.1"></label>
      <label>Length (m):     <input name="aisle${i}Length" type="number" value="10" step="0.1"></label>
      <label>Height (m):     <input name="aisle${i}Height" type="number" value="6"  step="0.1"></label>
      <label>Shelves (1–3):  <input name="aisle${i}Shelves" type="number" min="1" max="3" value="2"></label>
      <div id="shelves-${i}"></div>`;
    form.appendChild(card);
    const inp = card.querySelector(`[name="aisle${i}Shelves"]`);
    inp.addEventListener('input', () => renderShelves(i, +inp.value, card.querySelector(`#shelves-${i}`)));
    renderShelves(i, +inp.value, card.querySelector(`#shelves-${i}`));
  }
}

function renderShelves(aisleIdx, count, container) {
  container.innerHTML = '';
  for (let j = 1; j <= count; j++) {
    const card = document.createElement('details');
    card.className = 'card'; card.open = true;
    card.innerHTML = `
      <summary>Shelf ${j}</summary>
      <label>Depth (m):     <input name="aisle${aisleIdx}Shelf${j}Width"  type="number" value="0.5"  step="0.1"></label>
      <label>Length (m):    <input name="aisle${aisleIdx}Shelf${j}Length" type="number" value="10"   step="0.1"></label>
      <label>Thickness (m): <input name="aisle${aisleIdx}Shelf${j}Height" type="number" value="0.2"  step="0.01"></label>
      <label>Boxes (1–3):   <input name="aisle${aisleIdx}Shelf${j}Boxes"  type="number" min="1" max="3" value="2"></label>
      <div id="boxes-${aisleIdx}-${j}"></div>`;
    container.appendChild(card);
    const inp = card.querySelector(`[name="aisle${aisleIdx}Shelf${j}Boxes"]`);
    inp.addEventListener('input', () => renderBoxes(aisleIdx, j, +inp.value, card.querySelector(`#boxes-${aisleIdx}-${j}`)));
    renderBoxes(aisleIdx, j, +inp.value, card.querySelector(`#boxes-${aisleIdx}-${j}`));
  }
}

function renderBoxes(aisleIdx, shelfIdx, count, container) {
  container.innerHTML = '';
  for (let k = 1; k <= count; k++) {
    const card = document.createElement('details');
    card.className = 'card';
    card.innerHTML = `
      <summary>Box ${k}</summary>
      <label>W (m): <input name="aisle${aisleIdx}Shelf${shelfIdx}Box${k}Width"  type="number" value="0.8" step="0.1"></label>
      <label>H (m): <input name="aisle${aisleIdx}Shelf${shelfIdx}Box${k}Height" type="number" value="0.8" step="0.1"></label>
      <label>L (m): <input name="aisle${aisleIdx}Shelf${shelfIdx}Box${k}Length" type="number" value="0.8" step="0.1"></label>`;
    container.appendChild(card);
  }
}

function parseForm() {
  const data = new FormData(document.getElementById('config-form'));
  const numA = +document.getElementById('numAisles').value;
  const aisles = [];
  for (let i = 1; i <= numA; i++) {
    const shelves = [];
    const sCount  = +data.get(`aisle${i}Shelves`);
    for (let j = 1; j <= sCount; j++) {
      const boxes = [];
      const bCount = +data.get(`aisle${i}Shelf${j}Boxes`);
      for (let k = 1; k <= bCount; k++) boxes.push({
        width:  +data.get(`aisle${i}Shelf${j}Box${k}Width`),
        height: +data.get(`aisle${i}Shelf${j}Box${k}Height`),
        length: +data.get(`aisle${i}Shelf${j}Box${k}Length`)
      });
      shelves.push({
        width:  +data.get(`aisle${i}Shelf${j}Width`),
        length: +data.get(`aisle${i}Shelf${j}Length`),
        height: +data.get(`aisle${i}Shelf${j}Height`),
        boxes
      });
    }
    aisles.push({
      width:  +data.get(`aisle${i}Width`),
      length: +data.get(`aisle${i}Length`),
      height: +data.get(`aisle${i}Height`),
      shelves
    });
  }
  return { aisles };
}

async function buildScene(cfg) {
  const container = document.getElementById('scene-container');
  container.innerHTML = '';
  
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(60, container.clientWidth/container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0xffffff);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
  scene.background = new THREE.Color(0xffffff);

  // Lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(5,10,8);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Materials & loader
  const loader = new THREE.TextureLoader();
  const floorMat = new THREE.MeshStandardMaterial({ color:0x888888, roughness:0.9 });
  const woodMat  = new THREE.MeshStandardMaterial({ map:loader.load('wood_plank_color.png'), normalMap:loader.load('wood_plank_normal.png'), roughnessMap:loader.load('wood_plank_roughness.png') });
  const steelMat = new THREE.MeshStandardMaterial({ map:loader.load('steel_metal_color.png'), normalMap:loader.load('steel_metal_normal.png'), metalnessMap:loader.load('steel_metal_metalrough.png'), roughnessMap:loader.load('steel_metal_metalrough.png') });
  const crateMat = new THREE.MeshStandardMaterial({ map:loader.load('crate_wood_color.png'), normalMap:loader.load('crate_wood_normal.png'), roughnessMap:loader.load('crate_wood_roughness.png') });

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(50,50), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true;
  scene.add(floor);

  // Build racks, wire decking, tie-beams, braces
  cfg.aisles.forEach((aisle, i) => {
    const boardTh    = aisle.shelves[0].height;
    const xOff       = i * (aisle.width + aisle.shelves[0].width);
    const gapY       = 0.3;
    const shelfCount = aisle.shelves.length;

    // compute shelf heights
    const Ys = [ boardTh/2 ];
    for (let j=1; j<shelfCount; j++) {
      const prevBoxes = aisle.shelves[j-1].boxes;
      const maxH = prevBoxes.length ? Math.max(...prevBoxes.map(b=>b.height)) : 0;
      Ys.push(Ys[j-1] + boardTh + maxH + gapY);
    }

    aisle.shelves.forEach((sh,j) => {
      const by = Ys[j];
      // board
      const board = new THREE.Mesh(new THREE.BoxGeometry(sh.width, boardTh, sh.length), woodMat);
      board.position.set(xOff, by, 0);
      board.castShadow = board.receiveShadow = true;
      scene.add(board);
      // wire-mesh decking
      const deck = new THREE.Mesh(new THREE.BoxGeometry(sh.width, 0.02, sh.length), new THREE.MeshStandardMaterial({ color:0x999999, metalness:0.3, roughness:0.7, wireframe:true }));
      deck.position.set(xOff, by + boardTh/2 + 0.01, 0);
      scene.add(deck);
      // crates
      const padZ = 0.1;
      const avail= sh.length - 2*padZ;
      sh.boxes.forEach((b,k) => {
        const depth = Math.min(b.length, avail/sh.boxes.length) - padZ;
        const cz    = -avail/2 + depth/2 + k*(depth+padZ);
        const cy    = by + boardTh/2 + b.height/2 + 0.05;
        const crate = new THREE.Mesh(new THREE.BoxGeometry(b.width,b.height,depth), crateMat);
        crate.position.set(xOff, cy, cz);
        crate.castShadow = crate.receiveShadow = true;
        scene.add(crate);
      });
      // bottom poles
      if(j===0){ const hw=sh.width/2, hl=sh.length/2; [-hw,hw].forEach(px=>[-hl,hl].forEach(pz=>{
        const post=new THREE.Mesh(new THREE.BoxGeometry(0.1,aisle.height,0.1), steelMat);
        post.position.set(xOff+px, aisle.height/2, pz); post.castShadow=true; scene.add(post);
      }));}
    });

    // tie-beam top
    const tie = new THREE.Mesh(new THREE.BoxGeometry(aisle.width,0.05,0.05), steelMat);
    tie.position.set(xOff, aisle.height-0.02, 0);
    scene.add(tie);
    // back diagonal brace
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.05, aisle.height, 0.05), steelMat);
    brace.position.set(xOff, aisle.height/2, -aisle.shelves[0].length/2);
    brace.rotation.z = Math.atan(aisle.height / (aisle.width/2));
    scene.add(brace);

    // aisle sign
    const signTex = (() => { const c=document.createElement('canvas'),s=256; c.width=c.height=s; const ctx=c.getContext('2d'); ctx.fillStyle='#FFF'; ctx.fillRect(0,0,s,s); ctx.fillStyle='#000'; ctx.font='bold 100px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(`Aisle ${i+1}`,s/2,s/2); return new THREE.CanvasTexture(c); })();
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(aisle.width*0.8, aisle.width*0.3), new THREE.MeshBasicMaterial({ map:signTex, side:THREE.DoubleSide }));
    sign.position.set(xOff, Ys[shelfCount-1] + boardTh/2 + 0.6, -0.6);
    scene.add(sign);
  });

  // overhead lights
  aisleCount = cfg.aisles.length;
  for(let i=0;i<aisleCount;i++){
    const fx = new THREE.Mesh(new THREE.PlaneGeometry(1,10), new THREE.MeshStandardMaterial({ emissive:0xFFFFFF, emissiveIntensity:2 }));
    fx.rotation.x = -Math.PI/2;
    fx.position.set(i*(cfg.aisles[0].width+cfg.aisles[0].shelves[0].width), cfg.aisles[0].height+0.1,0);
    scene.add(fx);
  }

  // floor safety stripe
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.2,50), new THREE.MeshBasicMaterial({ color:0xFFD700 }));
  stripe.position.x = cfg.aisles[0].width/2 + cfg.aisles[0].shelves[0].width;
  scene.add(stripe);

  // load real forklift model
  const gltfLoader = new GLTFLoader();
  const mid = Math.floor(cfg.aisles.length/2);
  const a   = cfg.aisles[mid];
  const xOff= mid*(a.width + a.shelves[0].width);
  const d   = a.shelves[0].length;
  gltfLoader.load('forklift.glb', gltf => {
    const truck = gltf.scene;
    truck.scale.set(0.5,0.5,0.5);
    truck.position.set(xOff,0,d/2+1);
    truck.traverse(c=>c.castShadow=true);
    scene.add(truck);
  });

  // camera + zoom
  camera.position.set(10,10,20);
  camera.lookAt(0,0,0);
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();const v=new THREE.Vector3();camera.getWorldDirection(v);camera.position.addScaledVector(v,e.deltaY*0.01);});

  // render
  (function anim(){requestAnimationFrame(anim);renderer.render(scene,camera);})();
  window.addEventListener('resize',()=>{const w=container.clientWidth,h=container.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);});
}