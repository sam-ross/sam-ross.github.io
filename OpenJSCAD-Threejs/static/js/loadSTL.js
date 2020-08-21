        import * as THREE from '../three/build/three.module.js'         //  import three.js from within the static folder, relative to the location of this file
        import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
        import { STLLoader } from '../three/examples/jsm/loaders/STLLoaderOpenJSCAD.js'
        
        let scene, camera, controls, renderer, centerX, centerY, centerZ, physicsWorld, tmpTrans, clock, rigidBodies = [], bodiesArray = [], transformArray = [], heightArray = [];
        var hasBeenRanOnce = false;
        var objectArray;
        var firstObject = true;


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
            createBlock();
            //createCrossPlane(0, 2, 0);
            //createCrossPlane(0, 9.4, 0);
            //createCrossPlane(0, 22.8, 1.88);
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


        /**
         * Sets up the threejs scene and some of its details such as lighting etc.
         */
        function setUpGraphics(){
            // Create clock for timing
            clock = new THREE.Clock();

            scene = new THREE.Scene();
            scene.background = new THREE.Color( 0xbfd1e5 );
            camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.02, 5000 );
            
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

            // This line means when the browser window is resized, the threejs page will resize also
            window.addEventListener( 'resize', onWindowResize, false );
        
        }
        

        /**
         * Sets up the orbit controls and sets the default camera position (viewing angle) to (0,30,70).
         * By default, it will orbit about (0,0,0) until the final mesh of the OpenJSCAD export is loaded in
         */
        function setUpOrbitControls(){
            controls = new OrbitControls( camera, renderer.domElement );
            camera.position.set( 50, 60, 90 );
            controls.update();
        }


        /**
         * This is the main function of this file - it takes in the stl data for each OpenJSCAD part and creates threejs and ammojs objects for each one
         * Instead of loading an stl file and reading its contents, the STLLoaderOpenJSCAD (imported on line 3) has been modified so it can load an stl from a string
         * It uses a global variable string (parent.export_stl) which contains the text that would be normally in the stl file which was exported from the OpenJSCAD side
         * loadNewSTL is ran through once for each mesh ie. the length of the objects array on line 1 of the OpenJSCAD code 
         * (can change the number or times it is run through by altering the for loop on line 93441 of index.js)
         * 
         */
        function loadNewSTL() {
            var loader = new STLLoader();

            // Creates the grey shiny material because without it, the meshes would just be pure white with no shading so it would be impossible to make out the individual shapes
            var material = new THREE.MeshPhongMaterial( { color: 0xAAAAAA, specular: 0x111111, shininess: 200 } );  
            loader.load( 
                // parent.export_stl is the global variable that stores the stl export text so this is taken and used to create the threejs meshes
                parent.export_stl,
            
                function ( geometry ) {
                    //console.log("Geometry: " + geometry);
                
                    // Checks if the geometry has colours passed through with it, but if not, then the default shiny grey is used
                    if (geometry.hasColors) {
                        material = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: true });
                    } else { 
                        console.log("This STL file doesn't have any colour properties, so the default will be used");
                    }

                    // Creates the threejs mesh using the geometry which was created in STLLoaderOpenJSCAD.js
                    let mesh = new THREE.Mesh( geometry, material );
					mesh.rotation.set( - Math.PI / 2, 0, 0 );
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    // Creates a bounding box around the mesh so this box can be used to work out the height and width etc.
                    var box = new THREE.Box3().setFromObject( mesh );
                    heightArray[parent.counter] = box.max.y-box.min.y;
                    console.log("Height: " + (heightArray[parent.counter]));
                    console.log("Z width max: " + box.max.z);
                    console.log("Z width min: " + box.min.z);

                    /**
                     * This whole if and if else statement is used so that once every part of the robot arm has loaded in, the orbit controls will orbit about the center of the object.
                     * It works by taking the coordinates of the first mesh then when the last mesh is loaded in, it works out the center between them.
                     */
                    if(firstObject == true){
                        var box = new THREE.Box3().setFromObject( mesh );

                        centerX = box.min.x
                        centerY = box.min.y;
                        centerZ = box.min.z;

                        // The object array is created in this if statement so that it is only created when the first mesh is loaded in
                        objectArray = new Array(parent.object_array_length);
                        console.log("Object array created");
                        firstObject = false;
                    }else if(parent.object_array_length == parent.counter+1){
                        var box = new THREE.Box3().setFromObject( mesh );

                        centerX = box.max.x - ((box.max.x-centerX) / 2);
                        centerY = box.max.y - ((box.max.y-centerY) / 2);
                        centerZ = box.max.z - ((box.max.z-centerZ) / 2);

                        // This line sets the new orbit controls target to the center for the x, y and z coordinates
                        controls.target.set(centerX, centerY, centerZ);         
                        controls.update();  // The controls must be updated for the change in target to take effect

                        console.log("Orbit center position: (" + centerX + ", " + centerY + ", " + centerZ + ")");
                    }
                    console.log("Object array position: " + parent.counter);
                    
                    objectArray[parent.counter] = mesh; 
                    
                    //console.log(geometry.attributes.position.array[0]);
                    //console.log(geometry.attributes.position.count);

                    // Adds the threejs mesh to the scene
                    scene.add( objectArray[parent.counter] );
                }
            );

            // The collision shape for the mesh is worked out using the getObjectCollisionShape function call
            var collisionShape = getObjectCollisionShape();
            console.log("Collision shape for mesh " + (parent.counter + 1) + " created successfully");
            //console.log(collisionShape);


            /**
             * Ammojs section
             */
            let pos = objectArray[parent.counter].position;
            //console.log(objectArray[parent.counter].position);
            let quat = objectArray[parent.counter].quaternion;
            
            // The mass is currently set to zero which means each mesh will be static and won't fall under the forces of gravity
            // If the mass is set to >0 then the object is no longer static and will fall if the parts aren't connected together using constraints
            let mass = 0;

            let transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
            transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
            transformArray[parent.counter] = transform; 
            let motionState = new Ammo.btDefaultMotionState( transform );

            collisionShape.setMargin( 0.05 );

            let localInertia = new Ammo.btVector3( 0, 0, 0 );
            /* This is used to set the first part to static which is useful when the other parts aren't static
            if(parent.counter == 0){
                mass = 0;
            }
            */
            collisionShape.calculateLocalInertia( mass, localInertia );

            let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, collisionShape, localInertia );
            let body = new Ammo.btRigidBody( rbInfo );

            // This bodiesArray is used for storing the bodies of each part so they can be accessed later when createing constraints
            bodiesArray[parent.counter] = body;

            physicsWorld.addRigidBody( body );
            
            objectArray[parent.counter].userData.physicsBody = body;
            rigidBodies.push(objectArray[parent.counter]);



            /*
            // This is the code for the first constraint which is between the base and the first cylinder.
            // This constraint seems to work as expected and it is a fixes constraint
            if(parent.counter == 1){
                let fixed = new Ammo.btFixedConstraint( bodiesArray[parent.counter-1], bodiesArray[parent.counter], transformArray[parent.counter-1], transformArray[parent.counter]);
                physicsWorld.addConstraint( fixed, false );
            }
            */

            /*
            // This is the code for the hinge constraint between part 2 and 3 and it doesn't quite work as intended as part 3 slides to the side
            // This is the current point of uncertainty in the project 
            if(parent.counter == 2){
                //create hinge joint
                //let pivot1 = new Ammo.btVector3( 0, 3.75, 0 ); //btVector3 represents 3D points and vectors
                //let pivot2 = new Ammo.btVector3( 0, -6.7, -1.88 );
                let pivot1 = new Ammo.btVector3( 0, 3.75, 0 ); //btVector3 represents 3D points and vectors
                let pivot2 = new Ammo.btVector3( 0, -1, 0 );
                var axis = new Ammo.btVector3( 0, 1, 0 );
                var hinge = new Ammo.btHingeConstraint( bodiesArray[parent.counter-1], bodiesArray[parent.counter], pivot1, pivot2, axis, axis, true );
                physicsWorld.addConstraint( hinge, true );
            }
            */
           

            //console.log(objectArray[parent.counter].geometry.attributes.position.array[0]);

            parent.current_object++; 
            parent.export_stl = '';     // Resets the global variable so that the stl text for the next part can be stored
            hasBeenRanOnce = false;
            parent.export_fully_completed = true;
            console.log("Export fully completed: " + parent.export_fully_completed + " " + (parent.counter+1));
            parent.counter++;
            // When all of the parts have been imported successfully
            if(parent.object_array_length == parent.counter){
                console.log("All meshes exported successfully");
                console.log("Balls have been dropped");
                dropBall();
            }
            
        }


        /**
         * This function is used to create an ammojs collision shape from a threejs mesh
         * It takes the 3 xyz points that make up a triangle and creates an ammojs collision shape by forming all these triangles together
         */
        function getObjectCollisionShape(){
            var i, index = 0, _vec3_1, _vec3_2, _vec3_3, triangle_mesh = new Ammo.btTriangleMesh, shape;
            var _vec3_1 = new Ammo.btVector3(0,0,0);
            var _vec3_2 = new Ammo.btVector3(0,0,0);
            var _vec3_3 = new Ammo.btVector3(0,0,0);

            // for every triangle that is in the array
            for ( i = 0; i < objectArray[parent.counter].geometry.attributes.position.count/3; i++ ) {

                // _vec3_1 is just one point of a triangle 
                _vec3_1.setX(objectArray[parent.counter].geometry.attributes.position.array[index]);
                _vec3_1.setY(objectArray[parent.counter].geometry.attributes.position.array[index+1]);
                _vec3_1.setZ(objectArray[parent.counter].geometry.attributes.position.array[index+2]);

                // these 3 coordinates make up the next point of the triangle
                _vec3_2.setX(objectArray[parent.counter].geometry.attributes.position.array[index+3]);
                _vec3_2.setY(objectArray[parent.counter].geometry.attributes.position.array[index+4]);
                _vec3_2.setZ(objectArray[parent.counter].geometry.attributes.position.array[index+5]);

                _vec3_3.setX(objectArray[parent.counter].geometry.attributes.position.array[index+6]);
                _vec3_3.setY(objectArray[parent.counter].geometry.attributes.position.array[index+7]);
                _vec3_3.setZ(objectArray[parent.counter].geometry.attributes.position.array[index+8]);

                index = index+9;

                triangle_mesh.addTriangle(
                    _vec3_1,
                    _vec3_2,
                    _vec3_3,
                    true    // this boolean is for removeDuplicateVertices
                );
            }

            shape = new Ammo.btBvhTriangleMeshShape(
                triangle_mesh,
                true,   // this boolean is for useQuantizedAabbCompression
                true    // this boolean is for buildBvh
            );

            //console.log(_vec3_1);
            //console.log(_vec3_2);
            //console.log(_vec3_3);

            // returns a fully formed ammojs collision shape that is ready to use for collisions and constraints etc. 
            return shape;
        }

        
        /**
         * Allows you to create visual threejs cross planes to help visualise where certain points are
         * This is very useful when trying to add constraints
         */
        function createCrossPlane(x, y, z){
            //Arm Plane 1
            var plane = new THREE.Mesh(
                new THREE.PlaneBufferGeometry( 20, 0.2 ),
                new THREE.MeshPhongMaterial( { color: 0x6f7175, specular: 0x101010 } )
            );
            //plane.rotation.x = - Math.PI / 2;
            plane.position.x = x;
            plane.position.y = y;
            plane.position.z = z;
            scene.add( plane );
            plane.receiveShadow = true;

            //Arm Plane 2
            var plane2 = new THREE.Mesh(
                new THREE.PlaneBufferGeometry( 25, 0.2 ),
                new THREE.MeshPhongMaterial( { color: 0x6f7175, specular: 0x101010 } )
            );
            plane2.rotation.y = - Math.PI / 2;
            plane2.position.x = x;
            plane2.position.y = y;
            plane2.position.z = z;
            scene.add( plane2 );
            plane2.receiveShadow = true;
        }


        /**
         * Used to drop multiple ammojs balls from above - very basic but useful for testing that collision shapes are working as intended 
         */
        function dropBall(){
            var i, j;
            for(i = 0; i<12; i++){
                for(j = 0; j<15; j++){
                    let pos = {x: i, y: 250, z: j};
                    let radius = 2;
                    let quat = {x: 0, y: 0, z: 0, w: 1};

                    // The mass is set to 1, so these balls will fall due to the forces of gravity (declared earlier as -10)
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
            }
        }


        /**
         * Adds the static ammojs block to the scene so that when the robot arm is no longer set to static it will have a block to stand on (no longer static when mass > 0) 
         */
        function createBlock(){
                
            let pos = {x: 0, y: -1, z: 0};
            let scale = {x: 30, y: 2, z: 30};
            let quat = {x: 0, y: 0, z: 0, w: 1};

            // mass is set to 0 so this means the block is static and hence won't fall under gravity
            let mass = 0;

            //threeJS Section
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
            let motionState = new Ammo.btDefaultMotionState( transform );

            let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
            colShape.setMargin( 0.05 );

            let localInertia = new Ammo.btVector3( 0, 0, 0 );
            colShape.calculateLocalInertia( mass, localInertia );

            let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
            let body = new Ammo.btRigidBody( rbInfo );


            physicsWorld.addRigidBody( body);
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


        function onWindowResize() {

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize( window.innerWidth, window.innerHeight );

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

            updatePhysics( deltaTime );

            requestAnimationFrame( animate );
            
            renderer.render( scene, camera );

            // Used so that loadNewSTL is only ran once because animate is constantly looping through
            // It checks that the export stl string is not empty ie. so that the object has actually been exported
            // It uses the boolean variable, hasBeenRanOnce, to ensure that loadNewSTL is only ran once per mesh
            if(parent.export_stl !== "" && hasBeenRanOnce == false){
                console.log("Export found");
                //console.log("STL code: " + parent.export_stl);
                hasBeenRanOnce = true;
                //console.log("OpenJSCAD code: " + parent.openjscad_code);

                // this function call actually creates the threejs and ammojs object from the stl text within the parent.export.stl string
                loadNewSTL();
            }
        };