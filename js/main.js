const DEBUG = true;
const ANGLE = Math.PI / 2;
const CUBE_SIZE = 10;
const GAP_SIZE = 0;
const PRECISION = 0.001;
var ROTATION_STEP = 0.2;
var USE_BASIC_CONTROLS = true;
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
//var mousePosition = new THREE.Vector3();
var intersectedCube, clickedCube, clickedFace, allCubes = [], groupedCubes = [];
var startCube, endCube;
var roundedCubeModel;
var allMoves = [];

var rubikGame;
var gameSize = 3;

let rotationAxis, rotationDirection;


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

    rubikGame = new Rubik(gameSize);

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

    domEvent = new THREEx.DomEvents(camera, renderer.domElement);

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


function createMove(x, y) {
    console.log(camera);
    let cubeEdge = (gameSize * CUBE_SIZE + (gameSize - 1) * GAP_SIZE) / 2;
    let rubikFace;
    let rotations = {
        "x": {
            "y": "z",
            "z": "y"
        },
        "y": {
            "x": "z",
            "z": "x"
        },
        "z": {
            "x": "y",
            "y": "x"
        }
    };

    if(clickedCube && !isRotating) {
        let centroid = clickedFace.centroid.clone();
        let cubePosition = clickedCube.position.clone();
        centroid.applyMatrix4(clickedCube.matrixWorld);

        let direction = convertVectorTo3D(x, y);
        console.log(direction);
        direction.sub(cubePosition);
        console.log("Direction:");
        console.log(direction);

        let directionAxis = getDirectionAxis(direction);
        console.log("Direction axis: " + directionAxis);

        for(let axis in centroid) {
            if(isEqual(Math.abs(centroid[axis]), cubeEdge)) {
               rubikFace = axis;
            }
        }

        if(rubikFace && directionAxis) {
            rotationAxis = rotations[rubikFace][directionAxis];
        }

        console.log("rubikFace: " + rubikFace + " | directionAxis: " + directionAxis + " | rotationAxis: " + rotationAxis);

        if(!rotationAxis) {
            console.log("No rotation axis");
            return 0;
            if(rubikFace == directionAxis) {
                console.log("rubikFace == directionAxis");
                let screenPosition = toScreenPosition(clickedCube, camera);
                console.log(screenPosition);
                if(Math.abs(screenPosition.x - x) > Math.abs(screenPosition.y - y)) {

                }
            }
        }

        if(direction[directionAxis] > 0) {
            rotationDirection = 1;
        } else {
            rotationDirection = -1;
        }

        if ((rubikFace == "z" && rotationAxis == "x") || (rubikFace == "x" && rotationAxis == "z") || (rubikFace == "y" && rotationAxis == "z")) {
            rotationDirection *= -1;
        }

        if (cubePosition[rubikFace] < 0) {
            rotationDirection *= -1;
        }

        pivot = createGroup(rotationAxis);
        // TODO move this to Move object - create move and then create group based on the move
    }

}


function createMoveBasic() {
    let cubeEdge = (gameSize * CUBE_SIZE + (gameSize - 1) * GAP_SIZE) / 2;
    let rubikFace;
    let rotations = {
        "x": {
            "y": "z",
            "z": "y"
        },
        "y": {
            "x": "z",
            "z": "x"
        },
        "z": {
            "x": "y",
            "y": "x"
        }
    };

    if(startCube && endCube && !isRotating) {
        let centroid = clickedFace.centroid.clone();
        let direction = new THREE.Vector3();
        let start = new THREE.Vector3();

        centroid.applyMatrix4(startCube.matrixWorld);
        start.add(startCube.position.clone());
        direction.add(endCube.position.clone());
        direction.sub(start);

        let directionAxis = getDirectionAxis(direction);

        if(Math.abs(direction[directionAxis]) < CUBE_SIZE) {
            return 0;
        }

        for(let axis in centroid) {
            if(isEqual(Math.abs(centroid[axis]), cubeEdge)) {
               rubikFace = axis;
            }
        }

        if(rubikFace && directionAxis) {
            rotationAxis = rotations[rubikFace][directionAxis];
        }

        if(!rotationAxis) {
            console.log("No rotation axis");
            return 0;
        }

        if(direction[directionAxis] > 0) {
            rotationDirection = 1;
        } else {
            rotationDirection = -1;
        }

        if ((rubikFace == "z" && rotationAxis == "x") || (rubikFace == "x" && rotationAxis == "y") || (rubikFace == "y" && rotationAxis == "z")) {
            rotationDirection *= -1;
        }

        if(startCube.position[rubikFace] < 0) {
            rotationDirection *= -1;
        }

        pivot = createGroup(rotationAxis);
    }

}


function createGroup(axis) {
    console.log("Creating group for " + axis + " axis");

    pivot = new THREE.Object3D();
    pivot.rotation.set(0, 0, 0);
    pivot.updateMatrixWorld();
    scene.add(pivot);

    for(let i = 0; i < rubikGame.cubes.length; i++) {
        if(isEqual(rubikGame.cubes[i].position[axis], startCube.position[axis])) {
            groupedCubes.push(rubikGame.cubes[i]);
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
    raycaster.setFromCamera(mousePosition, camera);

    var intersects = raycaster.intersectObjects(rubikGame.cubes);

    // TODO: add highlight for row and column connected to the cube being hovered
    if ( intersects.length > 0 ) {
        if ( intersectedCube != intersects[ 0 ].object ) {
            if ( intersectedCube ) {
                intersectedCube.material.emissive.setHex(intersectedCube.currentHex);
            }
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
    checkIfSolved();
}


function checkIfSolved() {
    // todo: check Rubik.cubes array and if their faces are coloured properly
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
    if(startCube && clickedFace) {
        if(!isRotating && intersectedCube) {
            if(USE_BASIC_CONTROLS) {
                createMoveBasic();
            } else {
                createMove(e.clientX, e.clientY);
            }
        }
    }
}


function cubeMouseDownHandler(e) {
    console.log("cubeMouseDownHandler function");
    controls.enabled = false;
    startCube = e.target;
    clickedFace = e.intersect.face;
}


function cubeMouseUpHandler(e) {
    console.log("cubeMouseUpHandler function");
    controls.enabled = true;
    endCube = e.target;
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
    for (let f = 0; f < geometry.faces.length; f++) {
        let face = geometry.faces[f];
        face.centroid = new THREE.Vector3(0, 0, 0);
        face.centroid.add(geometry.vertices[face.a]);
        face.centroid.add(geometry.vertices[face.b]);
        face.centroid.add(geometry.vertices[face.c]);

        if (face instanceof THREE.Face3) {
            face.centroid.divideScalar(3);
        } else if ( face instanceof THREE.Face4 ) {
            face.centroid.add(geometry.vertices[face.d]);
            face.centroid.divideScalar(4);
        }
    }
}


function toScreenPosition(obj, camera) {
    var vector = new THREE.Vector3();

    var widthHalf = 0.5*renderer.context.canvas.width;
    var heightHalf = 0.5*renderer.context.canvas.height;

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;

    return {
        x: vector.x,
        y: vector.y
    };

}


function convertVectorTo3D(vector) {
    camera.lookAt(vector);
    let vector3D = new THREE.Vector3(vector.x, vector.y, 0.5);
    let result = new THREE.Vector3();

    vector3D.unproject(camera);
    vector3D.sub(camera.position).normalize();

    let distance = -camera.position.z / vector3D.z;

    result.copy(camera.position).add(vector3D.multiplyScalar(distance));

    return result;
}



// Classes

var Rubik = function(gameSize) {
    this.cubes = [];
    this.moves = [];

    let rubik = new THREE.Object3D();
    let cubeOffset = -(gameSize * CUBE_SIZE + GAP_SIZE * (gameSize - 1)) / 2;

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

                rubik.add(cube.mesh);
                this.cubes.push(cube.mesh);

                domEvent.addEventListener(cube.mesh, 'mousedown', function(e) {
                    console.log("cubeMouseDownHandler");
                    cubeMouseDownHandler(e);
                }, true);

                domEvent.addEventListener(cube.mesh, 'mouseup', function(e) {
                    console.log("cubeMouseUpHandler");
                    cubeMouseUpHandler(e);
                }, true);
            }
        }
    }

    scene.add(rubik);
}


var Cube = function(size) {
    let geometry = new THREE.CubeGeometry(size, size, size, 1, 1, 1);

    computeFaceCentroids(geometry);

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
    let bufferGeometry = new RoundedBoxGeometry(size, size, size, 1.35, 2);
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
var Move = function(cube, rotationAxis, rotationDirection) {
    this.cube = cube;
    this.rotationAxis = rotationAxis;
    this.rotationDirection = rotationDirection;
}
