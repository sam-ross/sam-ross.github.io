        import * as THREE from '../three/build/three.module.js'         //  import three.js from within the static folder, relative to the location of this file
        import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
        import { LoadingManager } from '../three/build/three.module.js';
        import URDFLoader from '../urdf-loader/src/URDFLoader.js';
        import { STLLoader } from '../three/examples/jsm/loaders/STLLoaderOpenJSCAD.js'
        
        let scene, camera, controls, renderer, centerHeight, centerPosition, physicsWorld, boxBody, tmpTrans, clock, rigidBodies = [];
        var hasBeenRanOnce = false;
        const STATE = { DISABLE_DEACTIVATION : 4 }
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
            dropBall();
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
            // Plane
            var plane = new THREE.Mesh(
                new THREE.PlaneBufferGeometry( 400, 400 ),
                new THREE.MeshPhongMaterial( { color: 0x6f7175, specular: 0x101010 } )
            );
            plane.rotation.x = - Math.PI / 2;
            plane.position.y = - 8;
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


        function dropBall(){
            let pos = {x: 0, y: 200, z: 0};
            let scale = {x: 5, y: 5, z: 5};
            let quat = {x: 0, y: 0, z: 0, w: 1};
            let mass = 2000;

            //threeJS Section
            let box = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0x0000FF}));

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
            
            boxBody.setFriction(4);
            //boxBody.setRollingFriction(10);
            boxBody.setActivationState(STATE.DISABLE_DEACTIVATION);
            physicsWorld.addRigidBody( boxBody );
            box.userData.physicsBody = boxBody;  
            rigidBodies.push(box);
            
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
            updatePhysics( deltaTime );

            requestAnimationFrame( animate );
            
            // required if controls.enableDamping or controls.autoRotate are set to true
            //controls.update();
            renderer.render( scene, camera );

            if(parent.export_stl !== "" && hasBeenRanOnce == false){
                console.log("export found");
                //console.log(parent.export_stl);
                hasBeenRanOnce = true;
                console.log(parent.openjscad_code);
                loadNewSTL();
            }
        };
        

        	