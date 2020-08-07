        import * as THREE from '../three/build/three.module.js'         //  import three.js from within the static folder, relative to the location of this file
        import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
        import { LoadingManager } from '../three/build/three.module.js';
        import URDFLoader from '../urdf-loader/src/URDFLoader.js';
        import { STLLoader } from '../three/examples/jsm/loaders/STLLoaderOpenJSCAD.js'
        
        let scene, camera, controls, renderer, centerHeight, centerPosition, physicsWorld, tmpTrans, clock, code, rigidBodies = [];
        let varName, nextStart, xyzIndex, xyzValueStr, xyzNumber, char, pivot, booleanValue, pivot2;
        let pivot1Created = false;
        var hasBeenRanOnce = false;
        var numberOfObjects = 0;
        let cylinder = null;
        let cylinderBody = null, boxBody = null, armBody=null, cylinderPivot = null, boxPivot = null, cylinderPivot2 = null, armPivot2 = null;     //  declared globally so can be used in the function for rotating the motor
        const STATE = { DISABLE_DEACTIVATION : 4 }
        let moveDirection = { up:0, down:0 }        //  moveDirection array
        //var count = 1;

        //Ammojs Initialization
        Ammo().then( function ( AmmoLib ) {
            Ammo = AmmoLib;
            start();
        } );

        function start(){
            tmpTrans = new Ammo.btTransform();
            setupPhysicsWorld();
            setUpGraphics();
            setUpOrbitControls();
            //dropBall();
            //dropBall2();
            //dropBall();
            //createBox();
            //createCylinder();
            //loadURDF();
            //createBlock();
            //loadSTL();
            setupEventHandlers();
            animate();
        }

        function setupPhysicsWorld(){
            let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
                dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
                overlappingPairCache = new Ammo.btDbvtBroadphase(),
                solver = new Ammo.btSequentialImpulseConstraintSolver();
    
            physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
            physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
        }


        function setUpGraphics(){
            //create clock for timing
            clock = new THREE.Clock();

            scene = new THREE.Scene();
            scene.background = new THREE.Color( 0xbfd1e5 );
            //scene.fog = new THREE.Fog( 0x72645b, 2, 15);
            camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.02, 5000 );
            //camera.lookAt(new THREE.Vector3(0, 0, 0));

            /*
            // Add hemisphere light
            let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
            hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
            hemiLight.groundColor.setHSL( 0.1, 1, 0.4 );
            hemiLight.position.set( 0, 50, 0 );
            scene.add( hemiLight );

            // Add directional light
            let dirLight = new THREE.DirectionalLight( 0xffffff , 1);
            dirLight.color.setHSL( 0.1, 1, 0.95 );
            dirLight.position.set( -1, 1.75, 1 );
            dirLight.position.multiplyScalar( 100 );
            scene.add( dirLight );

            dirLight.castShadow = true;

            dirLight.shadow.mapSize.width = 2048;
            dirLight.shadow.mapSize.height = 2048;

            let d = 50;

            dirLight.shadow.camera.left = -d;
            dirLight.shadow.camera.right = d;
            dirLight.shadow.camera.top = d;
            dirLight.shadow.camera.bottom = -d;

            dirLight.shadow.camera.far = 13500;
            */

            /*
            let x,y,z;
            x=0;
            y=-40;
            z=0;

            
            //Arm Plane
            var plane = new THREE.Mesh(
                new THREE.PlaneBufferGeometry( 20, 20 ),
                new THREE.MeshPhongMaterial( { color: 0x6f7175, specular: 0x101010 } )
            );
            //plane.rotation.x = - Math.PI / 2;
            plane.position.x = x;
            plane.position.y = z;
            plane.position.z = -y;
            scene.add( plane );

            plane.receiveShadow = true;


            y=y+10;

            //Arm Pivot
            var plane = new THREE.Mesh(
                new THREE.PlaneBufferGeometry( 20, 20 ),
                new THREE.MeshPhongMaterial( { color: 0x6f7175, specular: 0x101010 } )
            );
            //plane.rotation.x = - Math.PI / 2;
            plane.position.x = x;
            plane.position.y = z;
            plane.position.z = -y;
            scene.add( plane );

            plane.receiveShadow = true;
            */
            
            // Lights
            scene.add( new THREE.HemisphereLight( 0x443333, 0x111122 ) );

            addShadowedLight( 1, 1, 1, 0xffffff, 1.35 );
            addShadowedLight( 0.5, 1, - 1, 0xffffff, 1 );
            

            // Setup the renderer
            renderer = new THREE.WebGLRenderer( { antialias: true } );
            renderer.setClearColor( 0xbfd1e5 );
            renderer.setPixelRatio( window.devicePixelRatio );
            renderer.setSize( window.innerWidth, window.innerHeight );
            document.body.appendChild( renderer.domElement );

            renderer.gammaInput = true;
            renderer.gammaOutput = true;

            renderer.shadowMap.enabled = true;
        
        }


        function setupEventHandlers(){
            window.addEventListener('keydown', handleKeyDown, false);       //  calls the handleKeyDown function when any key is pressed down
            window.addEventListener('keyup', handleKeyUp, false);        //  calls the handleKeyUp function when any key is released
        }
        
        //  checks if the key that was pressed is the up or down key
        function handleKeyDown(event){
            let keyCode = event.keyCode;
            switch(keyCode){
                case 38:        //  when the up key is pressed down
                    moveDirection.up = 1;
                    break;
                case 40:        //  when the down key is pressed down
                    moveDirection.down = 1;
                    break;
                    
            }
        }
        
        //  checks if the key that was released is the up or down key
        function handleKeyUp(event){
            let keyCode = event.keyCode;
            switch(keyCode){
                case 38:        //  when the up key is released
                    moveDirection.up = 0;
                    break;
                case 40:        //  when the down key is released
                    moveDirection.down = 0;
                    break;
            }
        }
        

        function setUpOrbitControls(){
            controls = new OrbitControls( camera, renderer.domElement );
            camera.position.set( 0, 30, 70 );
            //controls.target.set(0, 20, 0);          // For the AR2 robot (sets orbit position to roughly the center of the robot)
            //controls.target.set(0, 0, 0);           // For the R2D2 robot (sets orbit position to roughly the center of the robot)
            controls.update();
        }
        

		function loadURDF(){
            const manager = new LoadingManager();
            const loader = new URDFLoader(manager);
            loader.packages = {
                //packageName : '../../static'           // The equivalent of a (list of) ROS package(s):// directory (unnecessary)
            };
            loader.load(
                //'static/urdf/T12/urdf/T12_flipped.URDF',
                //'/../static/urdf/r2d2/r2d2.urdf',
                '/../static/urdf/ar2_sim/ar2.urdf',                    // The path to the URDF within the package OR absolute
                robot => { 
                    // The robot is loaded!  
                    robot.position.set(0, 0, 0)
                    robot.scale.set(70,70,70);          // robot was too small initially
                    robot.rotateX(-1.571);          // robot had a 90 degrees rotation initially

                    controls.target.set(0, 15, 0);         
                    controls.update();


                    scene.add( robot );
                }
            );
        }
        

        function createBlock(){
            // code for the block
            let pos = {x: 0, y: 0, z: 0};
            let scale = {x: 50, y: 2, z: 50};       // sets block dimensions
            
            let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0xa0afa4}));

            blockPlane.position.set(pos.x, pos.y, pos.z);
            blockPlane.scale.set(scale.x, scale.y, scale.z);

            blockPlane.castShadow = true;
            blockPlane.receiveShadow = true;

            scene.add(blockPlane);
        }


        function loadSTL() {
            var loader = new STLLoader();
            var material = new THREE.MeshPhongMaterial( { color: 0xAAAAAA, specular: 0x111111, shininess: 200 } );
            loader.load( 
                // '/../static/modelsSTL/car.stl',
                '/../static/modelsSTL/test.stl',
                //'/../static/modelsSTL/car_improved.stl',
                //'/../static/modelsSTL/car_sphere_fixed.stl',
                //'/../static/modelsSTL/car_sphere_fixed_retro.stl',
                //'/../static/modelsSTL/car_sphere_fixed_retro2.stl',

                //'/../static/modelsSTL/downloaded_cottage.stl',
                //'/../static/modelsSTL/downloaded_sea_urchin.stl',

                //'/../static/modelsSTL/OpenJSCAD_cube_sphere.stl',

                //'/../static/modelsSTL/binary/pr2_head_pan.stl',
                //'/../static/modelsSTL/binary/colored.stl', 
                //'/../static/modelsSTL/ascii/slotted_disk.stl',
            
                function ( geometry ) {
                    console.log(geometry);
                    // use the same code to load STL as above
                    if (geometry.hasColors) {
                        material = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: true });
                    } else { 
                        console.log("This STL file doesn't have any colour properties, so the default will be used");
                    }
                    let mesh = new THREE.Mesh( geometry, material );
					mesh.rotation.set( - Math.PI / 2, 0, 0 );
                    //mesh.rotateX(-1.571); 
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    var box = new THREE.Box3().setFromObject( mesh );
                    
                    centerHeight = (box.max.y-box.min.y) / 2;
                    centerPosition = box.max.y - centerHeight;

                    controls.target.set(0, centerPosition, 0);           
                    controls.update();

                    console.log("Vertical center position: " + centerPosition);

                    scene.add( mesh );


                }
            );
        }


        function loadNewSTL() {
            var loader = new STLLoader();
            var material = new THREE.MeshPhongMaterial( { color: 0xAAAAAA, specular: 0x111111, shininess: 200 } );
            loader.load( 
                parent.export_stl,
            
                function ( geometry ) {
                    //console.log(geometry);
                
                    // use the same code to load STL as above
                    if (geometry.hasColors) {
                        material = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: true });
                    } else { 
                        console.log("This STL file doesn't have any colour properties, so the default will be used");
                    }
                    let mesh = new THREE.Mesh( geometry, material );
					mesh.rotation.set( - Math.PI / 2, 0, 0 );
                    //mesh.rotateX(-1.571); 
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    /*
                    if(count==1){
                        console.log("1st mesh");
                        //mesh.position.set(-4.6941E-06, 0.054174, 0.038824);
                    }else if(count == 2){
                        console.log("2nd mesh");
                        //mesh.position.set(-0.022706, 0.04294, -0.12205);
                    }
                    */

                    var box = new THREE.Box3().setFromObject( mesh );
                    
                    centerHeight = (box.max.y-box.min.y) / 2;
                    centerPosition = box.max.y - centerHeight;

                    controls.target.set(0, centerPosition, 0);         
                    controls.update();

                    console.log("Vertical center position: " + centerPosition);

                    
                    scene.add( mesh );


                }
            );
            parent.export_stl = '';
            hasBeenRanOnce = false;
            //count++;
        }

        
        function loadAmmoObjects(){
            code = parent.openjscad_code;
            console.log(code);

            numberOfObjects = (code.match(/objects.push/g) || []).length;       // at the minute must remember to hit f5 to update and also includes comments so fix in future

            if(numberOfObjects == 2){
                console.log("2 objects");
                importAndCreateBox();
                importAndCreateCylinder();
            }else if(numberOfObjects == 3){
                console.log("3 objects");
                importAndCreateBox();
                importAndCreateCylinder();
                importAndCreateArm();
            }else{
                console.log("Currently only supporting block, cylinder and arm (arm is optional)")
            }
            
        }

        /*
        function createPlane(){
            let pos = {x: 0, y: -7, z: 40};
                let scale = {x: 40, y: 1, z: 20}; //sets block dimensions
                let quat = {x: 0, y: 0, z: 1, w: 1};
                let mass = 0;

                //threeJS Section (for graphics)
                let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0xa0afa4}));

                blockPlane.position.set(pos.x, pos.y, pos.z);
                blockPlane.scale.set(scale.x, scale.y, scale.z);

                blockPlane.castShadow = true;
                blockPlane.receiveShadow = true;

                scene.add(blockPlane);


                //Ammojs Section
                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
                transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
                
                //motion state stores the state/status of the motion of the rigid bodies
                let motionState = new Ammo.btDefaultMotionState( transform );
                
                //box-shaped collision shape created for box with same dimensions 
                let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
                colShape.setMargin( 0.05 );

                let localInertia = new Ammo.btVector3( 0, 0, 0 );
                colShape.calculateLocalInertia( mass, localInertia );
                
                //instance of rigid body object created (body) using the info gained from parameters passed through
                let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
                let body = new Ammo.btRigidBody( rbInfo );

                //the rigid body static box instance is added to the physics world
                // when you add collision groups and masks, the cylinder falls through the block
                physicsWorld.addRigidBody( body );
        }
        */

        
        function importAndCreateBox(){
            let pos, size, quat, mass;

            varName = "blockTranslation";
            nextStart = code.indexOf(varName) + varName.length;
            pos = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

            console.log(pos.x);
            console.log(pos.y);
            console.log(pos.z);

            varName = "blockSize";
            nextStart = code.indexOf(varName) + varName.length;
            size = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

            console.log(size.x);
            console.log(size.y);
            console.log(size.z);

            varName = "blockRotation";
            nextStart = code.indexOf(varName) + varName.length;
            quat = {x: (getArrayValue("x") * Math.PI/180), y: (getArrayValue("y") * Math.PI/180), z: (getArrayValue("z") * Math.PI/180), w: 1};

            console.log(quat.x);
            console.log(quat.y);
            console.log(quat.z);

            varName = "constraint1Block";
            nextStart = code.indexOf(varName) + varName.length;
            pivot = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

            console.log(pivot.x);
            console.log(pivot.y);
            console.log(pivot.z);

            varName = "blockMass";
            nextStart = code.indexOf(varName) + varName.length;
            mass = getVariableValue();
            console.log(mass);

            //threeJS Section - the box geometries goes: width, height, depth. Therefore, need to change the y and z values arround
            let box = new THREE.Mesh(new THREE.BoxBufferGeometry(size.x, size.z, size.y), new THREE.MeshPhongMaterial({ color: 0xAAAAAA, specular: 0x111111, shininess: 200 }));

            box.position.set(pos.x, pos.z, -pos.y);
            //box.scale.set(1, 1, 1);
            //box.rotateX(quat.x);
            //box.rotateY(quat.z);
            //box.rotateZ(-quat.y);
            

            box.castShadow = true;
            box.receiveShadow = true;

            scene.add(box);

        
            //Ammojs Section
            let transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin( new Ammo.btVector3( pos.x, pos.z, -pos.y ) );
            //transform.setRotation( new Ammo.btQuaternion( quat.x, quat.z, -quat.y, quat.w ) );
            let motionState = new Ammo.btDefaultMotionState( transform );

            let colShape = new Ammo.btBoxShape( new Ammo.btVector3( size.x * 0.5, size.z * 0.5, size.y * 0.5 ) );
            colShape.setMargin( 0.05 );

            let localInertia = new Ammo.btVector3( 0, 0, 0 );
            colShape.calculateLocalInertia( mass, localInertia );

            let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
            boxBody = new Ammo.btRigidBody( rbInfo );

            physicsWorld.addRigidBody( boxBody );
            
            boxPivot = new Ammo.btVector3(pivot.x, pivot.z, -pivot.y); 

            

            /*
            boxBody.setFriction(4);
            //boxBody.setRollingFriction(10);
            boxBody.setActivationState(STATE.DISABLE_DEACTIVATION);
            physicsWorld.addRigidBody( boxBody );
            box.userData.physicsBody = boxBody;  
            rigidBodies.push(box);
            */
           
        }

        
        function importAndCreateCylinder(){
            let pos, height, radius, quat, mass, constraintBoolean;

            //let pos = {x: 5, y: 3, z: 0};
            //let scale = {x: 1, y: 5, z: 1};
            //let quat = {x: 0, y: 0, z: 1, w: 1};
            //let mass = 1;

            varName = "cylTranslation";
            nextStart = code.indexOf(varName) + varName.length;
            pos = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

            console.log(pos.x);
            console.log(pos.y);
            console.log(pos.z);

            varName = "cylHeight";
            nextStart = code.indexOf(varName) + varName.length;
            height = getVariableValue();
            console.log(height);

            varName = "cylRadius";
            nextStart = code.indexOf(varName) + varName.length;
            radius = getVariableValue();
            console.log(radius);

            varName = "cylRotation";
            nextStart = code.indexOf(varName) + varName.length;
            quat = {x: (getArrayValue("x") / 90), y: (getArrayValue("y") / 90), z: (getArrayValue("z") / 90), w: 1};

            console.log(quat.x);
            console.log(quat.y);
            console.log(quat.z);

            varName = "constraint1Cyl";
            nextStart = code.indexOf(varName) + varName.length;
            pivot = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

            console.log(pivot.x);
            console.log(pivot.y);
            console.log(pivot.z);

            varName = "constraint2Cyl";
            nextStart = code.indexOf(varName) + varName.length;
            pivot2 = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

            console.log(pivot2.x);
            console.log(pivot2.y);
            console.log(pivot2.z);

            varName = "cylMass";
            nextStart = code.indexOf(varName) + varName.length;
            mass = getVariableValue();
            console.log(mass);

            varName = "createConstraint1";
            nextStart = code.indexOf(varName) + varName.length;
            constraintBoolean = getBooleanValue();
            console.log(constraintBoolean);


            //threeJS Section
            cylinder = new THREE.Mesh(new THREE.CylinderBufferGeometry(radius, radius, height, 16), new THREE.MeshPhongMaterial({ color: 0xAAAAAA, specular: 0x111111, shininess: 200 }));

            cylinder.position.set(pos.x, pos.z, -pos.y);
            //cylinder.scale.set(scale.x, scale.y, scale.z);

            //cylinder.rotateX(quat.x);
            //cylinder.rotateY(quat.z);
            //cylinder.rotateZ(-quat.y);
            
            
            cylinder.castShadow = true;
            cylinder.receiveShadow = true;

            scene.add(cylinder);

            
            
            //Ammojs Section
            let transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin( new Ammo.btVector3( pos.x, pos.z, -pos.y ) );
            transform.setRotation( new Ammo.btQuaternion( quat.x, quat.z, -quat.y, quat.w ) );
            let motionState = new Ammo.btDefaultMotionState( transform );

            let colShape = new Ammo.btCylinderShape( new Ammo.btVector3( radius, height*0.5, radius ) );
            colShape.setMargin( 0.005 );

            let localInertia = new Ammo.btVector3( 0, 0, 0 );
            colShape.calculateLocalInertia( mass, localInertia );

            let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
            cylinderBody = new Ammo.btRigidBody( rbInfo );
            
            //dynamic motion section
            cylinderBody.setFriction(4);
            cylinderBody.setRollingFriction(10);
            cylinderBody.setActivationState(STATE.DISABLE_DEACTIVATION);
            physicsWorld.addRigidBody(cylinderBody);
            cylinder.userData.physicsBody = cylinderBody;           //  
            rigidBodies.push(cylinder);
            
            cylinderPivot = new Ammo.btVector3(pivot.x, pivot.z, -pivot.y);
            
            
            if(constraintBoolean == true) {
                let p2p = new Ammo.btPoint2PointConstraint(cylinderBody, boxBody, cylinderPivot, boxPivot);     //  added in the cylinder function as it is called last
                physicsWorld.addConstraint(p2p, true);      //  the true parameter is to disable collisions between linked bodies (sets disableCollisionsBetweenLinkedBodies to true)        
                console.log("Constraint 1 added successfully");
                pivot1Created = true;           
            }else{
                console.log("Constraint 1 was not added");
            }
            

            cylinderPivot2 = new Ammo.btVector3(pivot2.x, pivot2.z, -pivot2.y);

             

            
        }
        

        /*
        function importAndCreateCylinder(){
        let pos, height, radius, quat, mass, constraintBoolean, scale;

        //let pos = {x: 5, y: 3, z: 0};
        //let scale = {x: 1, y: 5, z: 1};
        //let quat = {x: 0, y: 0, z: 1, w: 1};
        //let mass = 1;

        varName = "cylTranslation";
        nextStart = code.indexOf(varName) + varName.length;
        pos = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

        console.log(pos.x);
        console.log(pos.y);
        console.log(pos.z);

        varName = "cylHeight";
        nextStart = code.indexOf(varName) + varName.length;
        height = getVariableValue();
        console.log(height);

        varName = "cylRadius";
        nextStart = code.indexOf(varName) + varName.length;
        radius = getVariableValue();
        console.log(radius);

        varName = "cylRotation";
        nextStart = code.indexOf(varName) + varName.length;
        quat = {x: (getArrayValue("x") / 90), y: (getArrayValue("y") / 90), z: (getArrayValue("z") / 90), w: 1};

        console.log(quat.x);
        console.log(quat.y);
        console.log(quat.z);

        varName = "constraint1Cyl";
        nextStart = code.indexOf(varName) + varName.length;
        pivot = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

        console.log(pivot.x);
        console.log(pivot.y);
        console.log(pivot.z);

        varName = "constraint2Cyl";
        nextStart = code.indexOf(varName) + varName.length;
        pivot2 = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

        console.log(pivot2.x);
        console.log(pivot2.y);
        console.log(pivot2.z);

        varName = "cylMass";
        nextStart = code.indexOf(varName) + varName.length;
        mass = getVariableValue();
        console.log(mass);

        varName = "createConstraint1";
        nextStart = code.indexOf(varName) + varName.length;
        constraintBoolean = getBooleanValue();
        console.log(constraintBoolean);


        //threeJS Section
        cylinder = new THREE.Mesh(new THREE.CylinderBufferGeometry(1, 1, 1, 16), new THREE.MeshPhongMaterial({ color: 0xAAAAAA, specular: 0x111111, shininess: 200 }));

        cylinder.position.set(pos.x, pos.z, -pos.y);
        cylinder.scale.set(10, 20, 10);

        //cylinder.rotateX(quat.x);
        //cylinder.rotateY(quat.z);
        //cylinder.rotateZ(-quat.y);
        
        
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;

        scene.add(cylinder);

        
        
        //Ammojs Section
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin( new Ammo.btVector3( pos.x, pos.z, -pos.y ) );
        transform.setRotation( new Ammo.btQuaternion( quat.x, quat.z, -quat.y, quat.w ) );
        let motionState = new Ammo.btDefaultMotionState( transform );

        let colShape = new Ammo.btCylinderShape( new Ammo.btVector3( 10*.5, 20*0.5, 10*.5 ) );
        colShape.setMargin( 0.005 );

        let localInertia = new Ammo.btVector3( 0, 0, 0 );
        colShape.calculateLocalInertia( mass, localInertia );

        let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
        cylinderBody = new Ammo.btRigidBody( rbInfo );
        
        //dynamic motion section
        cylinderBody.setFriction(4);
        cylinderBody.setRollingFriction(10);
        cylinderBody.setActivationState(STATE.DISABLE_DEACTIVATION);
        physicsWorld.addRigidBody(cylinderBody);
        cylinder.userData.physicsBody = cylinderBody;           //  
        rigidBodies.push(cylinder);
        
        cylinderPivot = new Ammo.btVector3(pivot.x, pivot.z, -pivot.y);
        
        
        if(constraintBoolean == true) {
            let p2p = new Ammo.btPoint2PointConstraint(cylinderBody, boxBody, cylinderPivot, boxPivot);     //  added in the cylinder function as it is called last
            physicsWorld.addConstraint(p2p, true);      //  the true parameter is to disable collisions between linked bodies (sets disableCollisionsBetweenLinkedBodies to true)        
            console.log("Constraint 1 added successfully");
            pivot1Created = true;           
        }else{
            console.log("Constraint 1 was not added");
        }
        

        cylinderPivot2 = new Ammo.btVector3(pivot2.x, pivot2.z, -pivot2.y);

    
        }
        */





        


        function importAndCreateArm(){
            let pos, size, quat, mass, constraintBoolean;

            varName = "armTranslation";
            nextStart = code.indexOf(varName) + varName.length;
            pos = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

            console.log(pos.x);
            console.log(pos.y);
            console.log(pos.z);

            varName = "armSize";
            nextStart = code.indexOf(varName) + varName.length;
            size = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

            console.log(size.x);
            console.log(size.y);
            console.log(size.z);

            varName = "armRotation";
            nextStart = code.indexOf(varName) + varName.length;
            quat = {x: (getArrayValue("x") * Math.PI/180), y: (getArrayValue("y") * Math.PI/180), z: (getArrayValue("z") * Math.PI/180), w: 1};

            console.log(quat.x);
            console.log(quat.y);
            console.log(quat.z);

            varName = "constraint2Arm";
            nextStart = code.indexOf(varName) + varName.length;
            pivot2 = {x: getArrayValue("x"), y: getArrayValue("y"), z: getArrayValue("z")};

            console.log(pivot2.x);
            console.log(pivot2.y);
            console.log(pivot2.z);

            varName = "armMass";
            nextStart = code.indexOf(varName) + varName.length;
            mass = getVariableValue();
            console.log(mass);

            varName = "createConstraint2";
            nextStart = code.indexOf(varName) + varName.length;
            constraintBoolean = getBooleanValue();
            console.log(constraintBoolean);

            //threeJS Section - the box geometries goes: width, height, depth. Therefore, need to change the y and z values arround
            let arm = new THREE.Mesh(new THREE.BoxBufferGeometry(size.x, size.z, size.y), new THREE.MeshPhongMaterial({ color: 0xAAAAAA, specular: 0x111111, shininess: 200 }));

            arm.position.set(pos.x, pos.z, -pos.y);
            //arm.scale.set(1, 1, 1);
            //arm.rotateX(quat.x);
            //arm.rotateY(quat.z);
            //arm.rotateZ(-quat.y);
            

            arm.castShadow = true;
            arm.receiveShadow = true;

            scene.add(arm);

            
            
            //Ammojs Section
            let transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin( new Ammo.btVector3( pos.x, pos.z, -pos.y ) );
            //transform.setRotation( new Ammo.btQuaternion( quat.x, quat.z, -quat.y, quat.w ) );
            let motionState = new Ammo.btDefaultMotionState( transform );

            let colShape = new Ammo.btBoxShape( new Ammo.btVector3( size.x * 0.5, size.z * 0.5, size.y * 0.5 ) );
            colShape.setMargin( 0.005 );

            let localInertia = new Ammo.btVector3( 0, 0, 0 );
            colShape.calculateLocalInertia( mass, localInertia );

            let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
            armBody = new Ammo.btRigidBody( rbInfo );

            //dynamic motion section
            //armBody.setFriction(4);
            //armBody.setRollingFriction(10);
            armBody.setActivationState(STATE.DISABLE_DEACTIVATION);
            physicsWorld.addRigidBody(armBody);
            arm.userData.physicsBody = armBody;           //  
            rigidBodies.push(arm);

            
            armPivot2 = new Ammo.btVector3(pivot2.x, pivot2.z, -pivot2.y); 

            /*
            boxBody.setFriction(4);
            //boxBody.setRollingFriction(10);
            boxBody.setActivationState(STATE.DISABLE_DEACTIVATION);
            physicsWorld.addRigidBody( boxBody );
            box.userData.physicsBody = boxBody;  
            rigidBodies.push(box);
            */
            /*
            if(constraintBoolean == true) {
                let p2p = new Ammo.btPoint2PointConstraint(cylinderBody, boxBody, cylinderPivot2, armPivot2);     //  added in the cylinder function as it is called last
                physicsWorld.addConstraint(p2p, true);      //  the true parameter is to disable collisions between linked bodies (sets disableCollisionsBetweenLinkedBodies to true)        
                console.log("Constraint 2 added successfully");
                //pivot1Created = true;           
            }else{
                console.log("Constraint 2 was not added");
            }
            */


           let p2p = new Ammo.btPoint2PointConstraint(armBody, cylinderBody, armPivot2, cylinderPivot2);     //  added in the cylinder function as it is called last
           physicsWorld.addConstraint(p2p, true);      //  the true parameter is to disable collisions between linked bodies (sets disableCollisionsBetweenLinkedBodies to true)  
            
        }





        function getArrayValue(letter){
            if(letter === "z"){
                char = '}';
            }else{
                char = ',';
            }
            xyzIndex = code.indexOf(letter, nextStart);        //  has to be very specific incase the user adds whitespace between certain characters eg. between x and :
            nextStart = code.indexOf(char, xyzIndex);
            xyzValueStr = code.substring(code.indexOf(":", xyzIndex)+1, nextStart).trim();
            xyzNumber = parseFloat(xyzValueStr);
            return xyzNumber
        }


        function getVariableValue(){
            xyzValueStr = code.substring(code.indexOf("=", nextStart)+1, code.indexOf(";", nextStart)).trim();
            xyzNumber = parseFloat(xyzValueStr);
            return xyzNumber
        }


        function getBooleanValue(){
            xyzValueStr = code.substring(code.indexOf("=", nextStart)+1, code.indexOf(";", nextStart)).trim();
            if(xyzValueStr=="true"){
                booleanValue=true;
            }else{
                booleanValue="false";
                console.log("Boolean value:" + xyzValueStr);
            }
            return booleanValue
        }


        function dropBall(){
                
                let pos = {x: 1, y: 50, z: 30};
                let radius = 2;
                let quat = {x: 0, y: 0, z: 0, w: 1};
                let mass = 1;

                //threeJS Section
                let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({color: 0xff0505}));

                ball.position.set(pos.x, pos.y, pos.z);
                
                ball.castShadow = true;
                ball.receiveShadow = true;

                scene.add(ball);


                //Ammojs Section
                let transform = new Ammo.btTransform();
                transform.setIdentity();
                transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
                transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
                let motionState = new Ammo.btDefaultMotionState( transform );

                let colShape = new Ammo.btSphereShape( radius );
                colShape.setMargin( 0.05 );

                let localInertia = new Ammo.btVector3( 0, 0, 0 );
                colShape.calculateLocalInertia( mass, localInertia );

                let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
                let body = new Ammo.btRigidBody( rbInfo );

                
                physicsWorld.addRigidBody( body );
                
                ball.userData.physicsBody = body;
                rigidBodies.push(ball);
        }

        function dropBall2(){
                
            let pos = {x: 0, y: 30, z: 0.5};
            let radius = 2;
            let quat = {x: 0, y: 0, z: 0, w: 1};
            let mass = 1;

            //threeJS Section
            let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({color: 0xff0505}));

            ball.position.set(pos.x, pos.y, pos.z);
            
            ball.castShadow = true;
            ball.receiveShadow = true;

            scene.add(ball);


            //Ammojs Section
            let transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
            transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
            let motionState = new Ammo.btDefaultMotionState( transform );

            let colShape = new Ammo.btSphereShape( radius );
            colShape.setMargin( 0.05 );

            let localInertia = new Ammo.btVector3( 0, 0, 0 );
            colShape.calculateLocalInertia( mass, localInertia );

            let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
            let body = new Ammo.btRigidBody( rbInfo );

            
            physicsWorld.addRigidBody( body );
            
            ball.userData.physicsBody = body;
            rigidBodies.push(ball);
    }


        function createBox(){
            let pos = {x: 0, y: 3, z: 0};
            let scale = {x: 5, y: 5, z: 5};
            let quat = {x: 0, y: 0, z: 0, w: 1};
            let mass = 0;

            //threeJS Section
            let box = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({ color: 0xAAAAAA, specular: 0x111111, shininess: 200 }));

            box.position.set(pos.x, pos.y, pos.z);
            box.scale.set(scale.x, scale.y, scale.z);

            box.castShadow = true;
            box.receiveShadow = true;

            scene.add(box);


            //Ammojs Section
            let transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
            transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
            let motionState = new Ammo.btDefaultMotionState( transform );

            let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
            colShape.setMargin( 0.05 );

            let localInertia = new Ammo.btVector3( 0, 0, 0 );
            colShape.calculateLocalInertia( mass, localInertia );

            let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
            boxBody = new Ammo.btRigidBody( rbInfo );

            physicsWorld.addRigidBody( boxBody );
            
            boxPivot = new Ammo.btVector3(5,0,0); 
            
        }
        

        function createCylinder(){
            let pos = {x: 5, y: 3, z: 0};
            let scale = {x: 1, y: 5, z: 1};
            let quat = {x: 0, y: 0, z: 1, w: 1};
            let mass = 1;

            //threeJS Section
            cylinder = new THREE.Mesh(new THREE.CylinderBufferGeometry(1, 1, 1, 16), new THREE.MeshPhongMaterial({ color: 0xAAAAAA, specular: 0x111111, shininess: 200 }));

            cylinder.position.set(pos.x, pos.y, pos.z);
            cylinder.scale.set(scale.x, scale.y, scale.z);
            cylinder.rotation.set(quat.x, quat.y, quat.z, quat.w);
            
            
            cylinder.castShadow = true;
            cylinder.receiveShadow = true;
            
            

            scene.add(cylinder);

            
            //Ammojs Section
            let transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
            transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
            let motionState = new Ammo.btDefaultMotionState( transform );

            let colShape = new Ammo.btCylinderShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
            colShape.setMargin( 0.05 );

            let localInertia = new Ammo.btVector3( 0, 0, 0 );
            colShape.calculateLocalInertia( mass, localInertia );

            let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
            cylinderBody = new Ammo.btRigidBody( rbInfo );
            
            //dynamic motion section
            cylinderBody.setFriction(4);
            cylinderBody.setRollingFriction(10);
            cylinderBody.setActivationState(STATE.DISABLE_DEACTIVATION);
            physicsWorld.addRigidBody(cylinderBody);
            cylinder.userData.physicsBody = cylinderBody;           //  
            rigidBodies.push(cylinder);
            
            cylinderPivot = new Ammo.btVector3(0,0,0);
            
            let p2p = new Ammo.btPoint2PointConstraint(cylinderBody, boxBody, cylinderPivot, boxPivot);     //  added in the cylinder function as it is called last
            physicsWorld.addConstraint(p2p, true);      //  the true parameter is to disable collisions between linked bodies (sets disableCollisionsBetweenLinkedBodies to true)    
            
        }


        function moveCylinder(){
            let scalingFactor = 1;      //  changes the speed of the rotation
            let resultantImpulse = new Ammo.btVector3(0, 0, moveDirection.up - moveDirection.down);      //  if the up and down keys are both pressed then it won't move
            resultantImpulse.op_mul(scalingFactor);     //  multiplies the rotation vector by the scaling factor
            let physicsBody = cylinder.userData.physicsBody;
            physicsBody.setAngularVelocity(resultantImpulse);
        }


        function addShadowedLight( x, y, z, color, intensity ) {

            var directionalLight = new THREE.DirectionalLight( color, intensity );
            directionalLight.position.set( x, y, z );
            scene.add( directionalLight );

            directionalLight.castShadow = true;

            var d = 1;
            directionalLight.shadow.camera.left = - d;
            directionalLight.shadow.camera.right = d;
            directionalLight.shadow.camera.top = d;
            directionalLight.shadow.camera.bottom = - d;

            directionalLight.shadow.camera.near = 1;
            directionalLight.shadow.camera.far = 4;

            directionalLight.shadow.bias = - 0.002;

        }


        function updatePhysics( deltaTime ) {
            // Step world
            physicsWorld.stepSimulation( deltaTime, 10 );

            // Update rigid bodies
            for ( let i = 0; i < rigidBodies.length; i++ )
            {
                let objThree = rigidBodies[ i ];
                let objAmmo = objThree.userData.physicsBody;
                let ms = objAmmo.getMotionState();
                if ( ms )
                {
                    ms.getWorldTransform( tmpTrans );
                    let p = tmpTrans.getOrigin();
                    let q = tmpTrans.getRotation();
                    objThree.position.set( p.x(), p.y(), p.z() );
                    objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
                }
            }
        }


        function animate() {

            let deltaTime = clock.getDelta();

            if(pivot1Created == true){
                moveCylinder();
            }

            updatePhysics( deltaTime );

            requestAnimationFrame( animate );
            
            // required if controls.enableDamping or controls.autoRotate are set to true
            //controls.update();
            renderer.render( scene, camera );

            if(parent.export_stl !== "" && hasBeenRanOnce == false){
                console.log("export found");
                //console.log(parent.export_stl);
                hasBeenRanOnce = true;
                //console.log(parent.openjscad_code);
                //loadNewSTL();
                loadAmmoObjects();
            }
        };
        

        	