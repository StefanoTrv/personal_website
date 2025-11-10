---
layout: null
---
import * as THREE from '{{ site.baseurl }}/js/threejs/three.module.js';
import { GLTFLoader } from '{{ site.baseurl }}/js/threejs/GLTFLoader.js';
import { RGBELoader } from '{{ site.baseurl }}/js/threejs/RGBELoader.js';

const graph_node_radius = 25; //Radius in pixel of the graph nodes
const graph_edge_click_distance = 5; //Maximum distance, in pixels, from a click point to an edge that will count as a click on the edge
let graph_highlight_edge = true;
const graph_highlighted_edge = 6;
let graph_animation_wait = 5;
let graph_reset = false;
let graph_current_color = "red";
const graph_pointer_icon = new Image();
let graph_scale_pointer = false;
let graph_pointer_coords;
const graph_cursor_size = 30;
const graph_cursor_size_scaled = 35;

const graph_buffer = document.createElement('canvas'); //buffer for restoring the canvas under the pointer icon
graph_buffer.width = graph_cursor_size_scaled;
graph_buffer.height = graph_cursor_size_scaled;
const graph_bufferCtx = graph_buffer.getContext('2d');

let is_hovering_photo = [false, false, false];

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
    new RGBELoader().load('{{ site.baseurl }}/assets/hdr/kiara_interior_1k.hdr', (hdrTexture) => {
        const envMap = pmrem.fromEquirectangular(hdrTexture).texture;
        scene.environment = envMap;
        hdrTexture.dispose();
        pmrem.dispose();
    });
    
    const video = document.getElementById('TVvideo');
    
    video.addEventListener('canplay', () => {
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.colorSpace = THREE.SRGBColorSpace;
        
        let model = null;
        let screen = null;
        const loader_GLTF = new GLTFLoader();
        loader_GLTF.load('{{ site.baseurl }}/assets/models/crt_tv.glb', (gltf) => { // load asset and set asset
            model = gltf.scene;
            model.scale.set(5, 5, 5);
            model.rotation.y += 2.8;
            model.position.set(0,-1.175,0);
            screen = model.getObjectByName('defaultMaterial_3');
            scene.add(gltf.scene);
            screen.material.map = videoTexture;           
            screen.material.needsUpdate = true;
        });
    });

    // Force Chrome to start loading the video
    video.load();
    video.play().catch((e) => {
        console.warn('Autoplay blocked:', e);
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
    
    const generalKenobi = new Audio('{{ site.baseurl }}/assets/audio/generalkenobi.mp3');
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
    graph_pointer_icon.src = '{{ site.baseurl }}/assets/img/Pointing_hand_cursor.png';
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
    let colors_original = [
        "#90A959",
        "#A63D40",
        "#FFEC51",
        "#FF674D",
        "#832161",
        "#662C91",
        "#5DB7DE",
        "#32965D",
        "#69585F",
        "#EF959D"
    ];
    let node_colors_original = [
        "white",
        "white",
        "white",
        "white",
        "white",
        "white",
        "white",
        "white",
        "white",
        "white"
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
    let node_colors = [];
    let free_nodes = [];
    let edge_stack = [];
    let colors = [];
    resetGraphVisit(nodes, edges, node_colors, node_colors_original, edge_status, free_nodes, edge_stack, colors, colors_original);
    
    let edge_lines = []; // y = mx + q (t[0]=m, t[1]=q) If the line is vertical, m is infinite and x = q.
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
    
    const graphcanvas = document.getElementById('graph_canvas');
    graphcanvas.style.userSelect = 'none'; //Disable selection on double click
    const ctx = graphcanvas.getContext('2d');
    
    graphcanvas.addEventListener('click', (event) => {
        let was_changed = false;
        
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
                was_changed = true;
            }
        }
        
        if (was_changed || graph_highlight_edge){ //Resets and redraws if some edge was changed
            graph_highlight_edge = false;
            resetGraphVisit(nodes, edges, node_colors, node_colors_original, edge_status, free_nodes, edge_stack, colors, colors_original);
            drawGraph(ctx, nodes, node_colors, edges, edge_status, graphcanvas);
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
        
    let edge = edges[graph_highlighted_edge];
    let x0 = graph_node_radius + nodes[edge[0]][0] * graph_node_radius * 2;
    let y0 = graph_node_radius + nodes[edge[0]][1] * graph_node_radius * 2;
    let x1 = graph_node_radius + nodes[edge[1]][0] * graph_node_radius * 2;
    let y1 = graph_node_radius + nodes[edge[1]][1] * graph_node_radius * 2;
    graph_pointer_coords = [(x0+x1)/2, (y0+y1)/2 - 10];
    
    graph_pointer_icon.onload = function() {
        drawGraph(ctx, nodes, node_colors, edges, edge_status, graphcanvas);
        setInterval(() => { //Execute and show algorithm
                animateGraph(ctx, nodes, edges, node_colors, free_nodes, edge_stack, node_colors_original, edge_status, graphcanvas, colors, colors_original);
            }, 1000);
    };
    
    /*
      Photo "carousel"
    */
    let photo_array = [
        ["{{ site.baseurl }}/assets/img/carousel/foto01.jpg", "https://it.wikipedia.org/wiki/Cytisus_decumbens_pindicola", "Flowering Cytisus decumbens pindicola"],
        ["{{ site.baseurl }}/assets/img/carousel/foto02.jpg", "https://it.wikipedia.org/wiki/Biotopo_magredi_di_San_Quirino", "Magredi of San Quirino"],
        ["{{ site.baseurl }}/assets/img/carousel/foto03.jpg", "https://it.wikipedia.org/wiki/Biotopo_magredi_di_San_Quirino", "Magredi of San Quirino"],
        ["{{ site.baseurl }}/assets/img/carousel/foto04.jpg", "https://it.wikipedia.org/wiki/Pescincanna", "Church of Pescincanna"],
        ["{{ site.baseurl }}/assets/img/carousel/foto05.jpg", "https://it.wikipedia.org/wiki/Chiesa_di_Sant%27Antonio_Abate_(Pravisdomini)", "Church of Saint Anthony Abbot in Pravisdomini"],
        ["{{ site.baseurl }}/assets/img/carousel/foto06.jpg", "https://it.wikipedia.org/wiki/Echinopsis_oxygona", "Flowering cactus"],
        ["{{ site.baseurl }}/assets/img/carousel/foto07.jpg", "https://it.wikipedia.org/wiki/Andreis", "Andreis"],
        ["{{ site.baseurl }}/assets/img/carousel/foto08.jpg", "https://it.wikipedia.org/wiki/Andreis", "Andreis"],
        ["{{ site.baseurl }}/assets/img/carousel/foto09.jpg", "https://it.wikipedia.org/wiki/Lago_di_Barcis", "Barcis Lake"],
        ["{{ site.baseurl }}/assets/img/carousel/foto10.jpg", "https://it.wikipedia.org/wiki/Andreis", "Andreis"],
        ["{{ site.baseurl }}/assets/img/carousel/foto11.jpg", "https://it.wikipedia.org/wiki/Azzano_Decimo", "Azzano Decimo"],
        ["{{ site.baseurl }}/assets/img/carousel/foto12.jpg", "https://it.wikipedia.org/wiki/Sacile", "Sacile"],
        ["{{ site.baseurl }}/assets/img/carousel/foto13.jpg", "https://it.wikipedia.org/wiki/Risorgive_del_Vinchiaruzzo", "Risorgive del Vinchiaruzzo"],
        ["{{ site.baseurl }}/assets/img/carousel/foto14.jpg", "https://it.wikipedia.org/wiki/Risorgive_del_Vinchiaruzzo", "Risorgive del Vinchiaruzzo"],
        ["{{ site.baseurl }}/assets/img/carousel/foto15.jpg", "https://it.wikipedia.org/wiki/Risorgive_del_Vinchiaruzzo", "Risorgive del Vinchiaruzzo"],
        ["{{ site.baseurl }}/assets/img/carousel/foto16.jpg", "https://it.wikipedia.org/wiki/Sacile", "Sacile"],
        ["{{ site.baseurl }}/assets/img/carousel/foto17.jpg", "https://it.wikipedia.org/wiki/Venezia", "Venice"],
        ["{{ site.baseurl }}/assets/img/carousel/foto18.jpg", "https://it.wikipedia.org/wiki/Stazione_di_Cusano", "Cusano railway station"],
        ["{{ site.baseurl }}/assets/img/carousel/foto19.jpg", "https://it.wikipedia.org/wiki/Stazione_di_Cusano", "Cusano railway station"],
        ["{{ site.baseurl }}/assets/img/carousel/foto20.jpg", "https://it.wikipedia.org/wiki/Andreis", "Andreis"],
        ["{{ site.baseurl }}/assets/img/carousel/foto21.jpg", "https://en.wikipedia.org/wiki/Florence_Cathedral", "Florence Cathedral"],
        ["{{ site.baseurl }}/assets/img/carousel/foto22.jpg", "https://en.wikipedia.org/wiki/Florence_Cathedral", "Florence Cathedral"],
        ["{{ site.baseurl }}/assets/img/carousel/foto23.jpg", "https://en.wikipedia.org/wiki/Uffizi", "The Uffizi Gallery"],
        ["{{ site.baseurl }}/assets/img/carousel/foto24.jpg", "https://en.wikipedia.org/wiki/Riva_del_Garda", "Riva del Garda"],
        ["{{ site.baseurl }}/assets/img/carousel/foto25.jpg", "https://it.wikipedia.org/wiki/Forni_di_Sopra", "Mountains near Forni di Sopra"],
        ["{{ site.baseurl }}/assets/img/carousel/foto26.jpg", "https://en.wikipedia.org/wiki/Urbino", "Urbino seen from its Ducal Palace"]
    ];
    
    randomizePhoto(1, photo_array);
    randomizePhoto(2, photo_array);
    randomizePhoto(3, photo_array);
    
    document.getElementById("photo_link_1").addEventListener('mouseenter', () => is_hovering_photo[0] = true);
    document.getElementById("photo_link_1").addEventListener('mouseleave', () => is_hovering_photo[0] = false);
    document.getElementById("photo_link_2").addEventListener('mouseenter', () => is_hovering_photo[1] = true);
    document.getElementById("photo_link_2").addEventListener('mouseleave', () => is_hovering_photo[1] = false);
    document.getElementById("photo_link_3").addEventListener('mouseenter', () => is_hovering_photo[2] = true);
    document.getElementById("photo_link_3").addEventListener('mouseleave', () => is_hovering_photo[2] = false);
    
    setInterval(() => { //Change a picture every 5 seconds (unless hovering)
            changeRandomPhoto(photo_array);
        }, 5000);
    
    /*
      Fake contact form
    */
    
    document.getElementById("button-fake-form").addEventListener('click', (event) => {
        sendFakeForm();
    });
    
    /*
      Delete loading wheel
    */
    document.getElementById("loading-wheel").remove();
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

function drawGraph(ctx, nodes, node_colors, edges, edge_status, canvas){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let edge;
    for (let i = 0; i < edges.length; i++) {
        edge = edges[i];
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
    
    if(graph_highlight_edge){ //Draw pointer icon to suggest interaction with edge
        graph_bufferCtx.drawImage(canvas, graph_pointer_coords[0], graph_pointer_coords[1], graph_cursor_size_scaled, graph_cursor_size_scaled, 0, 0, graph_cursor_size_scaled, graph_cursor_size_scaled);
        drawPointer(ctx, true);
    }
}

function drawPointer(ctx, on_clean){
    if (!on_clean){
        ctx.clearRect(graph_pointer_coords[0], graph_pointer_coords[1], graph_cursor_size_scaled, graph_cursor_size_scaled);
        ctx.drawImage(graph_buffer, graph_pointer_coords[0], graph_pointer_coords[1]);
    }
    let pointer_size;
    if (graph_scale_pointer){
        pointer_size = graph_cursor_size_scaled;
        graph_scale_pointer = false;
    } else {
        pointer_size = graph_cursor_size;
        graph_scale_pointer = true;
    }
    ctx.drawImage(graph_pointer_icon, graph_pointer_coords[0], graph_pointer_coords[1], pointer_size, pointer_size);
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

function resetGraphVisit(nodes, edges, node_colors, node_colors_original, edge_status, free_nodes, edge_stack, colors, colors_original){
    node_colors.length = 0;
    node_colors.push(...node_colors_original);
    free_nodes.length = 0;
    for (let i = 0; i < nodes.length; i++) {
        free_nodes.push(i);
    }
    edge_stack.length = 0;
    colors.length = 0;
    colors.push(...colors_original);
    graph_animation_wait = Math.max(graph_animation_wait,3);
    graph_reset = false;
}

function animateGraph(ctx, nodes, edges, node_colors, free_nodes, edge_stack, node_colors_original, edge_status, canvas, colors, colors_original){
    if (graph_animation_wait > 0) {
        graph_animation_wait -= 1;
        if (graph_highlight_edge) {
            drawPointer(ctx, false);
        }
        return;
    }
    if (graph_reset){
        resetGraphVisit(nodes, edges, node_colors, node_colors_original, edge_status, free_nodes, edge_stack, colors, colors_original);
        drawGraph(ctx, nodes, node_colors, edges, edge_status, canvas);
        return;
    }
    let edge, new_node;
    let found_new_node = false;
    while (edge_stack.length > 0){
        edge = edge_stack.pop();
        if (free_nodes.includes(edge[0])){
            new_node = edge[0];
        } else if (free_nodes.includes(edge[1])){
            new_node = edge[1];
        } else { //This is an internal edge
            continue;
        }
        for (let i = 0; i < edges.length; i++) { //Adds edges involving the new node
            if (edge != i && edge_status[i] == 'active' && (edges[i][0] == new_node || edges[i][1] == new_node)) { //Already visited edges may be re-visited, but they'll be skipped immediately
                edge_stack.push(edges[i]);
            }
        }
        node_colors[new_node] = graph_current_color;
        let index = free_nodes.indexOf(new_node);
        free_nodes.splice(index, 1);
        found_new_node = true;
        break;
    }
    if (found_new_node){ //Draw updated graph
        drawGraph(ctx, nodes, node_colors, edges, edge_status, canvas);
    } else if (free_nodes.length>0){ //Start DFS of a new node
        new_node = free_nodes[Math.floor(Math.random() * free_nodes.length)];
        for (let i = 0; i < edges.length; i++) {
            if (edge_status[i] == 'active' && (edges[i][0] == new_node || edges[i][1] == new_node)) {
                edge_stack.push(edges[i]);
            }
        }
        let index = free_nodes.indexOf(new_node);
        free_nodes.splice(index, 1);
        
        index = Math.floor(Math.random() * colors.length);
        graph_current_color = colors[index];
        colors.splice(index,1);
        
        node_colors[new_node] = graph_current_color;
        
        drawGraph(ctx, nodes, node_colors, edges, edge_status, canvas);
    } else { //Visit finished. Wait and then start new execution.
        if (graph_highlight_edge) {
            drawPointer(ctx, false);
        }
        graph_animation_wait = 4; //This execution already counts as 1
        graph_reset = true;
    }
}

function randomizePhoto(box_number, photo_array){
    let new_index;
    let new_src;
    let box_id = "photo_box_" + box_number.toString();
    let link_id = "photo_link_" + box_number.toString();
    do {
        new_index = Math.floor(Math.random() * photo_array.length);
        new_src = photo_array[new_index][0];
    } while (
                document.getElementById('photo_box_1').src.slice(-10) == new_src.slice(-10) ||
                document.getElementById('photo_box_2').src.slice(-10) == new_src.slice(-10) ||
                document.getElementById('photo_box_3').src.slice(-10) == new_src.slice(-10)
            );
    document.getElementById(box_id).src = new_src;
    document.getElementById(link_id).href = photo_array[new_index][1];
    document.getElementById(box_id).alt = photo_array[new_index][2];
}

function changeRandomPhoto(photo_array){
    let p = Math.floor(Math.random() * 3);
    if (!is_hovering_photo[p]){
        randomizePhoto(p+1, photo_array);
    }
}

function sendFakeForm(){
    if(validateFakeForm()){
        let subject = document.getElementById("fake-form-subject").value;
        let body = document.getElementById("fake-form-message").value;
        window.location.href = `mailto:stefanotravasci@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        document.getElementById("button-fake-form").innerHTML="Sent?";
    }
}

function validateFakeForm(){
    let name = document.getElementById("fake-form-name");
    let email = document.getElementById("fake-form-email");
    let subject = document.getElementById("fake-form-subject");
    let message = document.getElementById("fake-form-message");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let validated = true;
    if (name.value == ""){
        name.classList.add("is-invalid");
        name.classList.remove("is-valid");
        validated = false;
    } else {
        name.classList.add("is-valid");
        name.classList.remove("is-invalid");
    }
    if (!emailRegex.test(email.value)){
        email.classList.add("is-invalid");
        email.classList.remove("is-valid");
        validated = false;
    } else {
        email.classList.add("is-valid");
        email.classList.remove("is-invalid");
    }
    if (subject.value == ""){
        subject.classList.add("is-invalid");
        subject.classList.remove("is-valid");
        validated = false;
    } else {
        subject.classList.add("is-valid");
        subject.classList.remove("is-invalid");
    }
    if (message.value == ""){
        message.classList.add("is-invalid");
        message.classList.remove("is-valid");
        validated = false;
    } else {
        message.classList.add("is-valid");
        message.classList.remove("is-invalid");
    }
    return validated;
}