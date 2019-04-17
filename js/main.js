const DEBUG = true;
const ANGLE = Math.PI / 2;
const CUBE_SIZE = 10;
const GAP_SIZE = 0;
const PRECISION = 0.001;
var ROTATION_STEP = 0.2;
var USE_ROUNDED_CUBES = true;

var colors = [
    0x00b894, // green
    0x0984e3, // blue
    0xd63031, // red
    0xe17055, // orange
    0xdfe6e9, // white
    0xfdcb6e, // yellow
    0x2d3436 // black
];

var windowHeight = window.innerHeight;
var windowWidth = window.innerWidth;
var isRotating = false;
// todo: add start screen and cube animation
var isGameStarted = false;
var scene, camera, controls, raycaster, pivot, domEvent;
var mousePosition = {x: 0, y: 0};
var intersectedCube, clickedCube, allCubes = [], groupedCubes = [];
var roundedCubeModel;
var allMoves = [];

var rubik;
var gameSize = 3;


window.addEventListener("load", init, false);
window.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("mousedown", mouseDownHandler, false);
document.addEventListener("mouseup", mouseUpHandler, false);
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
}, false);
window.addEventListener("resize", handleWindowResize, false);



function init() {
    createScene();
    createLights();
    createRaycaster();
    createControls();

    if(DEBUG) {
        createHelpers();
    }

    rubik = new Rubik(gameSize);

    loop();
}


function loop() {
    controls.update();
    checkIntersection();

    if(isRotating) {
        rotateGroup();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}



// Creating things

function createScene() {
    let aspectRatio = windowWidth / windowHeight;
    let fieldOfView = 60;
    let nearPlane = 0.1;
    let farPlane = 1000;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );
    camera.position.x = 7;
    camera.position.y = 7;
    camera.position.z = 7;
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    renderer.setSize(windowWidth, windowHeight);
    renderer.shadowMap.enabled = true;

    domEvent = new THREEx.DomEvents(camera, renderer.domElement)

    container = document.querySelector("[js-scene]");
    container.appendChild(renderer.domElement);
}



function createLights() {
    let ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    let hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x333333, 0.25);

    scene.add(ambientLight, hemisphereLight);
}


function createRaycaster() {
    raycaster = new THREE.Raycaster();
    mousePosition = new THREE.Vector3();
}


function createControls() {
    controls = new THREE.TrackballControls(camera);

    controls.rotateSpeed = 5.0;
    controls.zoomSpeed = 3.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.2;
    controls.minDistance = 100;
    controls.maxDistance = 175;
}


function createHelpers() {
    let length = CUBE_SIZE * (gameSize + 1);
    let origin = new THREE.Vector3( 0, 0, 0 );
    let dir = new THREE.Vector3( 1, 1, 1 );
    dir.normalize();

    let axisHelper = new THREE.AxesHelper(length);
    let arrowHelper = new THREE.ArrowHelper(dir, origin, length, 0xffffff);

    scene.add(arrowHelper, axisHelper);
}


function createMove(endPoint) {
    let group;
// TODO: make sure this double check is not needed
//    if(clickedCube && !isRotating) {
        let direction = new THREE.Vector3();

        direction.set(endPoint.x, endPoint.y, 1);
        direction.sub(clickedCube.position);

        console.log(direction);

        // TODO check for clicked face of the cube
        let translations = {
            x: "y",
            y: "x",
            z: "y"
        };

        let axis = getDirectionAxis(direction);

        console.log(axis, direction[axis], endPoint[axis], clickedCube.position[axis]);
        console.log(CUBE_SIZE - Math.abs(direction[axis]));

        rotationAxis = translations[axis];

        if(direction[axis] > 0) {
            rotationDirection = 1;
        } else {
            rotationDirection = -1;
        }

        if (axis == "y") {
            rotationDirection *= -1;
        }

        pivot = createGroup(rotationAxis);
        // TODO move this to Move object
//    }

}


function createGroup(axis) {
    pivot = new THREE.Object3D();
    pivot.rotation.set(0, 0, 0);
    pivot.updateMatrixWorld();
    scene.add(pivot);

    for(let i = 0; i < allCubes.length; i++) {
        if(isEqual(allCubes[i].position[axis], clickedCube.position[axis])) {
            groupedCubes.push(allCubes[i]);
        }
    }

    for(let i = 0; i < groupedCubes.length; i++) {
        THREE.SceneUtils.attach(groupedCubes[i], scene, pivot);
    }

    isRotating = true;
    return pivot;
}



// Game mechanics

function checkIntersection() {
    raycaster.setFromCamera( mousePosition, camera );

    var intersects = raycaster.intersectObjects(allCubes);

    // TODO: add highlight for row and column connected to the cube being hovered
    if ( intersects.length > 0 ) {
        if ( intersectedCube != intersects[ 0 ].object ) {
            if ( intersectedCube ) intersectedCube.material.emissive.setHex(intersectedCube.currentHex);
            intersectedCube = intersects[ 0 ].object;
            intersectedCube.currentHex = intersectedCube.material.emissive.getHex();
            intersectedCube.material.emissive.setHex( 0x333333 );
        }
    } else {
        if ( intersectedCube ) intersectedCube.material.emissive.setHex(intersectedCube.currentHex);
        intersectedCube = null;
    }
}


function rotateGroup() {
    pivot.rotation[rotationAxis] += (ROTATION_STEP * rotationDirection);

    if(Math.abs(pivot.rotation[rotationAxis]) >= ANGLE) {

        pivot.rotation[rotationAxis] = ANGLE * rotationDirection;
        moveComplete();
    }

    pivot.updateMatrixWorld();
}


function moveComplete() {
    pivot.updateMatrixWorld();

    for(let i = 0; i < groupedCubes.length; i++) {
        groupedCubes[i].updateMatrixWorld();
        groupedCubes[i].position.applyMatrix4(pivot.matrixWorld);
        THREE.SceneUtils.detach(groupedCubes[i], pivot, scene);
    }

    scene.remove(pivot);
    groupedCubes = [];
    isRotating = false;
}



// Event functions

function handleWindowResize() {
    windowHeight = window.innerHeight;
    windowWidth = window.innerWidth;
    renderer.setSize(windowWidth, windowHeight);
    camera.aspect = windowWidth / windowHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
}


function mouseMoveHandler(e) {
    mousePosition.x = ( e.clientX / windowWidth ) * 2 - 1;
    mousePosition.y = - ( e.clientY / windowHeight ) * 2 + 1;
}


function mouseDownHandler(e, cube) {
    if(!intersectedCube) {
        clickedCube = undefined;
        controls.enabled = true;
    }
}


function mouseUpHandler(e) {
    if(clickedCube) {
        let endPoint = {
            x: (e.clientX / windowWidth) * 2 - 1,
            y: - (e.clientY / windowHeight) * 2 + 1
        };

        if(!isRotating) {
            createMove(endPoint);
        }
    }
}


function cubeMouseDownHandler(e) {
    controls.enabled = false;
    clickedCube = e.target;
}



// Helper functions

function isEqual(a, b, precision) {
    precision = precision || PRECISION;
    return Math.abs(a - b) <= precision;
}


function getDirectionAxis(vector) {
    let max = Math.abs(vector.x);
    let maxAxis = "x";

    if(Math.abs(vector.y) > max) {
        max = Math.abs(vector.y);
        maxAxis = "y";
    }

    if(Math.abs(vector.z) > max) {
        maxAxis = "z";
    }

    return maxAxis;
}


function computeFaceCentroids(geometry) {
    var f, fl, face;

    for (f = 0, fl = geometry.faces.length; f < fl; f ++) {
        face = geometry.faces[f];
        face.centroid = new THREE.Vector3(0, 0, 0);

        if (face instanceof THREE.Face3) {
            face.centroid.add(geometry.vertices[face.a] );
            face.centroid.add(geometry.vertices[face.b] );
            face.centroid.add(geometry.vertices[face.c] );
            face.centroid.divideScalar(3);
        } else if ( face instanceof THREE.Face4 ) {
            face.centroid.add(geometry.vertices[face.a] );
            face.centroid.add(geometry.vertices[face.b] );
            face.centroid.add(geometry.vertices[face.c] );
            face.centroid.add(geometry.vertices[face.d] );
            face.centroid.divideScalar(4);
        }

    }
}


// TODO: move all vector normalization here or investigate if there's a function for that in THREE
function normalize() {

}



// Classes

var Rubik = function(gameSize) {
    rubik = new THREE.Object3D();
    let cubeOffset = -(gameSize * CUBE_SIZE + GAP_SIZE * (gameSize - 1)) / 2;
    allCubes = [];

    for(let i = 0; i < gameSize; i++) {
        for(let j = 0; j < gameSize; j++) {
            for(let k = 0; k < gameSize; k++) {
                let cube;

                if(USE_ROUNDED_CUBES) {
                   cube = new RoundedCube(CUBE_SIZE);
                } else {
                   cube = new Cube(CUBE_SIZE);
                }

                cube.mesh.position.x = cubeOffset + i * CUBE_SIZE + i * GAP_SIZE + 0.5 * CUBE_SIZE;
                cube.mesh.position.y = cubeOffset + j * CUBE_SIZE + j * GAP_SIZE + 0.5 * CUBE_SIZE;
                cube.mesh.position.z = cubeOffset + k * CUBE_SIZE + k * GAP_SIZE + 0.5 * CUBE_SIZE;

                cube.castShadow = true;
                cube.receiveShadow = true;
                cube.mesh.castShadow = true;
                cube.mesh.receiveShadow = true;

                allCubes.push(cube.mesh);
                rubik.add(cube.mesh);

                domEvent.addEventListener(cube.mesh, 'mousedown', function(e){
                    console.log(e);
                    cubeMouseDownHandler(e);
                }, true);
            }
        }
    }
    scene.add(rubik);
}


var Cube = function(size) {
    let geometry = new THREE.CubeGeometry(size, size, size, 1, 1, 1);

    for (let i = 0; i < 12; i += 2) {
        let color = colors[i / 2];
        geometry.faces[i].color.setHex(color);
        geometry.faces[i + 1].color.setHex(color);
    };

    let material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: true,
        vertexColors: 0xdddddd
    });


    this.mesh = new THREE.Mesh(geometry, material);
}


var RoundedCube = function(size) {
    let bufferGeometry = new RoundedBoxGeometry(size, size, size, 1, 2);
    let color = colors[6];
    let geometry = new THREE.Geometry().fromBufferGeometry(bufferGeometry);

    computeFaceCentroids(geometry);


    for (let i = geometry.faces.length - 1; i >= 0; i--) {
        if(i < 12) {
            color = colors[Math.floor(i / 2)];
        }
        geometry.faces[i].color.setHex(color);
    };

    let material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: true,
        vertexColors: 0xffffff
    });

    this.mesh = new THREE.Mesh( geometry, material);
}


// TODO: add properties for move
var Move = function() {

}
