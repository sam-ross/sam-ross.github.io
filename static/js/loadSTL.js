        import * as THREE from '../three/build/three.module.js'         //  import three.js from within the static folder, relative to the location of this file
        import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
        import { LoadingManager } from '../three/build/three.module.js';
        import URDFLoader from '../urdf-loader/src/URDFLoader.js';
        import { STLLoader } from '../three/examples/jsm/loaders/STLLoaderOpenJSCAD.js'
        
        let scene, camera, controls, renderer, centerX, centerY, centerZ, physicsWorld, tmpTrans, clock, rigidBodies = [];
        var hasBeenRanOnce = false;
        var objectArray;
        var firstObject = true;

        const STATE = { DISABLE_DEACTIVATION : 4 }
        let moveDirection = { up:0, down:0 }        //  moveDirection array

        /*
        let varName, nextStart, xyzIndex, xyzValueStr, xyzNumber, char, pivot, booleanValue, pivot2, code;
        let pivot1Created = false;
        var numberOfObjects = 0;
        let cylinder = null;
        let cylinderBody = null, boxBody = null, armBody=null, cylinderPivot = null, boxPivot = null, cylinderPivot2 = null, armPivot2 = null;     //  declared globally so can be used in the function for rotating the motor
        */
        

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
            //loadURDF();
            //createBlock();
            //loadSTL();
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

            window.addEventListener( 'resize', onWindowResize, false );
        
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
                    //console.log("Geometry: " + geometry);
                
                    // use the same code to load STL as above
                    if (geometry.hasColors) {
                        material = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: true });
                    } else { 
                        console.log("This STL file doesn't have any colour properties, so the default will be used");
                    
                    }
                    //createCustomCollisionShape1(geometry);


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


                    
                    if(firstObject == true){
                        var box = new THREE.Box3().setFromObject( mesh );

                        centerX = box.min.x
                        centerY = box.min.y;
                        centerZ = box.min.z;

                        objectArray = new Array(parent.object_array_length);
                        console.log("array created");
                        firstObject = false;
                    } else if(parent.object_array_length == parent.counter+1){
                        var box = new THREE.Box3().setFromObject( mesh );

                        centerX = box.max.x - ((box.max.x-centerX) / 2);
                        centerY = box.max.y - ((box.max.y-centerY) / 2);
                        centerZ = box.max.z - ((box.max.z-centerZ) / 2);

                        controls.target.set(centerX, centerY, centerZ);         
                        controls.update();

                        console.log("Orbit center position: (" + centerX + ", " + centerY + ", " + centerZ + ")");
                    }
                    console.log("Object array position: " + parent.counter);
                    objectArray[parent.counter] = mesh; 
                    
                    scene.add( objectArray[parent.counter] );
                    

                    //console.log("Face 1: " + geometry.faces[0]);

                    /*
                    //Custom collision shape code
                    var i,
                        width, height, depth,
                        vertices, face, triangles = [];

                    //Physijs.Mesh.call( this, geometry, material, mass );

                    if ( !geometry.boundingBox ) {
                        geometry.computeBoundingBox();
                    }

                    vertices = geometry.vertices;

                    for ( i = 0; i < geometry.faces.length; i++ ) {
                        face = geometry.faces[i];
                        if ( face instanceof THREE.Face3) {
            
                            triangles.push([
                                { x: vertices[face.a].x, y: vertices[face.a].y, z: vertices[face.a].z },
                                { x: vertices[face.b].x, y: vertices[face.b].y, z: vertices[face.b].z },
                                { x: vertices[face.c].x, y: vertices[face.c].y, z: vertices[face.c].z }
                            ]);
            
                        } else if ( face instanceof THREE.Face4 ) {
            
                            triangles.push([
                                { x: vertices[face.a].x, y: vertices[face.a].y, z: vertices[face.a].z },
                                { x: vertices[face.b].x, y: vertices[face.b].y, z: vertices[face.b].z },
                                { x: vertices[face.d].x, y: vertices[face.d].y, z: vertices[face.d].z }
                            ]);
                            triangles.push([
                                { x: vertices[face.b].x, y: vertices[face.b].y, z: vertices[face.b].z },
                                { x: vertices[face.c].x, y: vertices[face.c].y, z: vertices[face.c].z },
                                { x: vertices[face.d].x, y: vertices[face.d].y, z: vertices[face.d].z }
                            ]);
            
                        }
                    }
                    */
                   //var triangles = [];
                   //triangles = THREE.getTrianglesArray(geometry);
                   //var collisionShape;

                }
            );
            parent.current_object++; 
            parent.export_stl = '';
            hasBeenRanOnce = false;
            parent.export_fully_completed = true;
            console.log("Export fully completed: " + parent.export_fully_completed + " " + (parent.counter+1));
            parent.counter++;
            if(parent.object_array_length == parent.counter){
                console.log("All meshes exported successfully");
                //createCustomCollisionShape()
            }
            
        }


        function dropBall(){
            var material = new THREE.MeshStandardMaterial( { color : 0x00cc00 } );

            //create a triangular geometry
            var geometry = new THREE.Geometry();
            geometry.vertices.push( new THREE.Vector3( -50, -50, 0 ) );
            geometry.vertices.push( new THREE.Vector3(  50, -50, 0 ) );
            geometry.vertices.push( new THREE.Vector3(  50,  50, 0 ) );

            //create a new face using vertices 0, 1, 2
            var normal = new THREE.Vector3( 0, 0, 1 ); //optional
            var color = new THREE.Color( 0xffaa00 ); //optional
            var materialIndex = 0; //optional
            var face = new THREE.Face3( 0, 1, 2, normal, color, materialIndex );

            //add the face to the geometry's faces array
            geometry.faces.push( face );

            //the face normals and vertex normals can be calculated automatically if not supplied above
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();

            scene.add( new THREE.Mesh( geometry, material ) );
                /*
            let pos = {x: 1, y: 200, z: 0};
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
            */
        }


        function createRigidBody( threeObject, physicsShape, mass, pos, quat ) {

            threeObject.position.copy( pos );
            threeObject.quaternion.copy( quat );

            var transform = new Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
            transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
            var motionState = new Ammo.btDefaultMotionState( transform );

            var localInertia = new Ammo.btVector3( 0, 0, 0 );
            physicsShape.calculateLocalInertia( mass, localInertia );

            var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
            var body = new Ammo.btRigidBody( rbInfo );

            threeObject.userData.physicsBody = body;

            scene.add( threeObject );

            if ( mass > 0 ) {
                rigidBodies.push( threeObject );

                // Disable deactivation
                body.setActivationState( 4 );
            }

            physicsWorld.addRigidBody( body );

            return body;
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
            
            // required if controls.enableDamping or controls.autoRotate are set to true
            //controls.update();
            renderer.render( scene, camera );

            if(parent.export_stl !== "" && hasBeenRanOnce == false){
                console.log("export found");
                //console.log(parent.export_stl);
                hasBeenRanOnce = true;
                //console.log(parent.openjscad_code);

                loadNewSTL();

                //loadAmmoObjects();
            }
        };
        

        	