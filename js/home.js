import * as THREE from './threejs/three.module.js';
import { GLTFLoader } from './threejs/GLTFLoader.js';
import { RGBELoader } from './threejs/RGBELoader.js';

const graph_node_radius = 25; //Radius in pixel of the graph nodes
const graph_edge_click_distance = 5; //Maximum distance, in pixels, from a click point to an edge that will count as a click on the edge
let graph_animate_edge = true;
const graph_animated_edge = 6;

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
    const tvcanvas = document.getElementById('tv_canvas');

    // Create renderer with fixed resolution
    const renderer = new THREE.WebGLRenderer({ canvas: tvcanvas, alpha: true, antialias: true });
    const width = tvcanvas.clientWidth;
    const height = tvcanvas.clientHeight;
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
    
    /*
        Graph thing
    */
    const nodes = [
        [0, 1],
        [4, 0],
        [8, 0],
        [2, 3],
        [4, 2],
        [6, 2],
        [0, 5],
        [4, 4],
        [7, 4],
        [6, 6]
    ];
    let node_colors = [
        "#CDC7E5",
        "#FFFBDB",
        "#FFEC51",
        "#FF674D",
        "#832161",
        "#662C91",
        "#6FD08C",
        "#32965D",
        "#69585F",
        "#EF959D"
    ];
    const edges = [
        [0, 1],
        [0, 3],
        [0, 6],
        [1, 2],
        [1, 3],
        [1, 4],
        [2, 4],
        [2, 5],
        [2, 8],
        [3, 4],
        [3, 6],
        [3, 7],
        [4, 5],
        [4, 7],
        [5, 7],
        [5, 8],
        [6, 7],
        [6, 9],
        [7, 8],
        [7, 9],
        [8, 9]
    ];
    let edge_status = [ //active, inactive
        'active',
        'inactive',
        'inactive',
        'inactive',
        'active',
        'active',
        'inactive',
        'active',
        'inactive',
        'active',
        'inactive',
        'inactive',
        'inactive',
        'inactive',
        'active',
        'active',
        'inactive',
        'active',
        'active',
        'inactive',
        'inactive'
    ];
    let edge_lines = []; // y = mx + q (t[0]=m, t[1]=q) If the line is vertical, m is infinite and x = q.
    const graphcanvas = document.getElementById('graph_canvas');
    graphcanvas.style.userSelect = 'none'; //Disable selection on double click
    const ctx = graphcanvas.getContext('2d');
    drawGraph(ctx, nodes, node_colors, edges, edge_status, graphcanvas.width, graphcanvas.height);
    for (let i = 0; i < edges.length; i++) {
        let x0 = graph_node_radius + nodes[edges[i][0]][0] * graph_node_radius * 2;
        let y0 = graph_node_radius + nodes[edges[i][0]][1] * graph_node_radius * 2;
        let x1 = graph_node_radius + nodes[edges[i][1]][0] * graph_node_radius * 2;
        let y1 = graph_node_radius + nodes[edges[i][1]][1] * graph_node_radius * 2;
        let m, q;
        if (x1 != x0) { //The line is not vertical
            m = (y1 - y0) / (x1 - x0);
            q = y0 - m * x0;
        } else { //The line is vertical
            m = Infinity;
            q = x0;
        }
        edge_lines.push([m,q]);
    }
    
    graphcanvas.addEventListener('click', (event) => {
        graph_animate_edge = false;
        let redraw = false;
        
        const rect = graphcanvas.getBoundingClientRect(); //position of canvas on screen
        const scaleX = graphcanvas.width / rect.width;
        const scaleY = graphcanvas.height / rect.height;
        
        const x_click = (event.clientX - rect.left) * scaleX;
        const y_click = (event.clientY - rect.top) * scaleY;
        
        //For each edge in the graph
        for (let i = 0; i < edges.length; i++) {
            let ms = edge_lines[i][0];
            let qs = edge_lines[i][1];
            
            //Gets the distance from the edge (see function for details)
            let distance = getDistanceFromEdge(x_click, y_click, ms, qs, nodes[edges[i][0]], nodes[edges[i][1]]);

            if (distance <= graph_edge_click_distance) {
                if (edge_status[i] == 'active'){
                    edge_status[i] = 'inactive';
                } else {
                    edge_status[i] = 'active';
                }
                redraw = true;
            }
        }
        
        if (redraw || graph_animate_edge){ //Redraw only if something was changed
            drawGraph(ctx, nodes, node_colors, edges, edge_status, graphcanvas.width, graphcanvas.height);
        }
        
    });
    
    graphcanvas.addEventListener('mousemove', (event) => {
        const rect = graphcanvas.getBoundingClientRect(); //position of canvas on screen
        const scaleX = graphcanvas.width / rect.width;
        const scaleY = graphcanvas.height / rect.height;
        
        const x_click = (event.clientX - rect.left) * scaleX;
        const y_click = (event.clientY - rect.top) * scaleY;
        
        //For each edge in the graph
        for (let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            let ms = edge_lines[i][0];
            let qs = edge_lines[i][1];
            
            //Gets the distance from the edge (see function for details)
            let distance = getDistanceFromEdge(x_click, y_click, ms, qs, nodes[edges[i][0]], nodes[edges[i][1]]);

            if (distance <= graph_edge_click_distance) {
                graphcanvas.style.cursor = 'pointer';
                return;
            }
        }
        
        graphcanvas.style.cursor = 'default';
        
    });
    
    setTimeout(() => {
            animateEdge2(ctx, nodes, edges, node_colors);
        }, 500);
};

function updateHeader(){
    let value = window.scrollY;
        
    header_title.style.marginTop = value * 1 + "px";
    pizza1.style.left = value * 1 + "px";
    pizza2.style.left = value * -1.25 + "px";
    pizza3.style.left = value * 2 + "px";
}

function drawNode(ctx, x, y, color) {
    ctx.beginPath();
    ctx.arc(graph_node_radius + x * graph_node_radius * 2, graph_node_radius + y * graph_node_radius * 2, graph_node_radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawEdge(ctx, x0, y0, x1, y1, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(graph_node_radius + x0 * graph_node_radius * 2, graph_node_radius + y0 * graph_node_radius * 2);
    ctx.lineTo(graph_node_radius + x1 * graph_node_radius * 2, graph_node_radius + y1 * graph_node_radius * 2);
    ctx.stroke();  
}

function drawGraph(ctx, nodes, node_colors, edges, edge_status, canvas_width, canvas_height){
    ctx.clearRect(0, 0, canvas_width, canvas_height);
    for (let i = 0; i < edges.length; i++) {
        let edge = edges[i];
        let color;
        let width;
        if (edge_status[i] == 'inactive'){
            color = 'black';
            width = 1;
        } else if (edge_status[i] == 'active' && node_colors[edge[0]] != node_colors[edge[1]]){
            color = 'white';
            width = 3;
        } else {
            color = node_colors[edge[0]];
            width = 3;
        }
        drawEdge(ctx,nodes[edge[0]][0],nodes[edge[0]][1],nodes[edge[1]][0],nodes[edge[1]][1], color, width);
    }
    for (let i = 0; i < nodes.length; i++) {
        drawNode(ctx, nodes[i][0], nodes[i][1], node_colors[i]);
    }
}

function getDistanceFromEdge(x_click, y_click, ms, qs, node0, node1){
            //Finds the equation of the line perpendicular to the edge and passing through the clicked point
            let mr, qr;
            if (ms == Infinity) { //Edge lays on a vertical line
                mr = 0;
                qr = y_click;
            } else if (ms == 0) { //Edge lays on a horizonal line
                mr = Infinity;
                qr = x_click;
            } else { //Edge lays on a sloped line
                mr = -(1/ms);
                qr = y_click - mr * x_click;
            }
            
            //Finds the intersection between the two lines
            let xi, yi;
            if (ms == Infinity) { //Edge lays on a vertical line
                xi = qs;
                yi = qr;
            } else if (ms == 0) { //Edge lays on a horizonal line
                xi = qr;
                yi = qs;
            } else { //Edge lays on a sloped line
                xi = (qr - qs) / (ms - mr);
                yi = ms * xi + qs;
            }
            
            //Finds the distance between the clicked point and the edge...
            let distance = null;
            let node0_x = graph_node_radius + node0[0] * graph_node_radius * 2;
            let node0_y = graph_node_radius + node0[1] * graph_node_radius * 2;
            let node1_x = graph_node_radius + node1[0] * graph_node_radius * 2;
            let node1_y = graph_node_radius + node1[1] * graph_node_radius * 2;
            
            //Two different cases for the distance (distance to the segment or to an extreme)
            if (xi >= Math.min(node0_x, node1_x) && xi <= Math.max(node0_x, node1_x) &&
                yi >= Math.min(node0_y, node1_y) && yi <= Math.max(node0_y, node1_y)
                ) {
                //Compute the distance between the clicked point and the segment (using the point of interesection with the line)
                distance = Math.sqrt((x_click - xi)**2 + (y_click - yi)**2);
                //We also want to ensure we are not clicking inside the circle of the displayed node
                //So, we also make sure that it is at least a radius aways from both the extremes
                let d0 = Math.sqrt((x_click - node0_x)**2 + (y_click - node0_y)**2);
                let d1 = Math.sqrt((x_click - node1_x)**2 + (y_click - node1_y)**2);
                if (d0 <= graph_node_radius || d1 <= graph_node_radius){
                    distance = graph_edge_click_distance * 8; //An arbitrarily large number
                }
            } else {
                //The distance is between the clicked point and the closer node belonging to the edge
                //However, we want to ignore the parts of the segments hidden below the node
                //Since the acceptable distance is less than the radius of the node, this case can be ignored
                distance = graph_edge_click_distance * 8; //An arbitrarily large number
            }
            return distance;
}

function animateEdge1(ctx, nodes, edges, node_colors){ //Only works if the edge is inactive
    if(!graph_animate_edge){
        return;
    }
    let edge = edges[graph_animated_edge];
    
    //Deletes previously drawn edge
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)'; // fully opaque = fully erased
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(graph_node_radius + nodes[edge[0]][0] * graph_node_radius * 2, graph_node_radius + nodes[edge[0]][1] * graph_node_radius * 2);
    ctx.lineTo(graph_node_radius + nodes[edge[1]][0] * graph_node_radius * 2, graph_node_radius + nodes[edge[1]][1] * graph_node_radius * 2);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    
    //Draws edge
    drawEdge(ctx,nodes[edge[0]][0],nodes[edge[0]][1],nodes[edge[1]][0],nodes[edge[1]][1], 'black', 1);
    drawNode(ctx, nodes[edge[0]][0], nodes[edge[0]][1], node_colors[edge[0]]);
    drawNode(ctx, nodes[edge[1]][0], nodes[edge[1]][1], node_colors[edge[1]]);
    
    //Continues animation
    setTimeout(() => {
            animateEdge2(ctx, nodes, edges, node_colors);
        }, 500);
}

function animateEdge2(ctx, nodes, edges, node_colors){ //Only works if the edge is inactive
    if(!graph_animate_edge){
        return;
    }
    let edge = edges[graph_animated_edge];
    drawEdge(ctx,nodes[edge[0]][0],nodes[edge[0]][1],nodes[edge[1]][0],nodes[edge[1]][1], 'red', 2);
    drawNode(ctx, nodes[edge[0]][0], nodes[edge[0]][1], node_colors[edge[0]]);
    drawNode(ctx, nodes[edge[1]][0], nodes[edge[1]][1], node_colors[edge[1]]);
    
    //Continues animation
    setTimeout(() => {
            animateEdge1(ctx, nodes, edges, node_colors);
        }, 500);
}