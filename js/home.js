import * as THREE from './threejs/three.module.js';
import { GLTFLoader } from './threejs/GLTFLoader.js';
import { RGBELoader } from './threejs/RGBELoader.js';

window.onload = function () {
    /*
        Header
    */
    let header_title = document.getElementById("header_title");
    let pizza1 = document.getElementById("pizza1");
    let pizza2 = document.getElementById("pizza2");
    let pizza3 = document.getElementById("pizza3");
    window.addEventListener("scroll", () => {
        updateHeader();
    })
    updateHeader();
    
    /*
        TV
    */
    const canvas = document.getElementById('tv_canvas');

    // Create renderer with fixed resolution
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, true);
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera (Perspective)
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const radius = 1.85;
    camera.position.x = radius * Math.sin(Math.PI/2) * Math.cos(Math.PI/2);
    camera.position.y = radius * Math.cos(Math.PI/2);
    camera.position.z = radius * Math.sin(Math.PI/2) * Math.sin(Math.PI/2);

    const plight = new THREE.PointLight(0xffffff, 35);
    plight.position.set(-2, 2.5, 2);
    plight.castShadow = true;
    scene.add(plight);
    
    const pmrem = new THREE.PMREMGenerator(renderer);
    new RGBELoader().load('../assets/hdr/kiara_interior_1k.hdr', (hdrTexture) => {
        const envMap = pmrem.fromEquirectangular(hdrTexture).texture;
        scene.environment = envMap;
        hdrTexture.dispose();
        pmrem.dispose();
    });
    
    const video = document.getElementById('TVvideo');
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    
    let model = null;
    let screen = null;
    const loader_GLTF = new GLTFLoader();
    loader_GLTF.load('../assets/models/crt_tv.glb', (gltf) => { // load asset and set asset
        model = gltf.scene;
        model.scale.set(5, 5, 5);
        model.rotation.y += 2.8;
        model.position.set(0,-1.175,0);
        screen = model.getObjectByName('defaultMaterial_3');
        scene.add(gltf.scene);
        screen.material.map = videoTexture;           
        screen.material.needsUpdate = true;
    });
    
    window.addEventListener('mousemove', (event) => { // rotate camera with cursor
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -((event.clientY / window.innerHeight) * 2 - 1);
        
        const theta = x * Math.PI/64 + Math.PI/2; //horizontal rotation
        const phi = y * Math.PI/64 + Math.PI/2; //vertical rotation
        
        camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
        
        camera.lookAt(0, 0, 0);
    });
    
    const generalKenobi = new Audio('../assets/audio/generalKenobi.mp3');
    generalKenobi.volume = 0.3;
    document.getElementById('hellothere').addEventListener('click', () => {
        generalKenobi.currentTime = 0; // Rewind if already playing
        generalKenobi.play();
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        
    }

    animate();
};

function updateHeader(){
    let value = window.scrollY;
        
    header_title.style.marginTop = value * 1 + "px";
    pizza1.style.left = value * 1 + "px";
    pizza2.style.left = value * -1.25 + "px";
    pizza3.style.left = value * 2 + "px";
}