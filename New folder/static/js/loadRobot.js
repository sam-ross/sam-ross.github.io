        
        import * as THREE from '../three/build/three.module.js'         //import three.js from within the static folder, relative to the location of this file
        var scene = new THREE.Scene();
        scene.background = new THREE.Color( 0xbfd1e5 );
        var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.02, 5000 );
        //camera.lookAt(new THREE.Vector3(0, 0, 0));

        //Add hemisphere light
        let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
        hemiLight.color.setHSL( 0.6, 0.6, 0.6 );
        hemiLight.groundColor.setHSL( 0.1, 1, 0.4 );
        hemiLight.position.set( 0, 50, 0 );
        scene.add( hemiLight );

        //Add directional light
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

        //Setup the renderer
        var renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setClearColor( 0xbfd1e5 );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        renderer.gammaInput = true;
        renderer.gammaOutput = true;

        renderer.shadowMap.enabled = true;
        
            
        // Controls setup
        import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'

        var controls = new OrbitControls( camera, renderer.domElement );
        camera.position.set( 0, 30, 70 );
        controls.target.set(0, 20, 0);          // sets orbit position to roughly the center of the robot
        controls.update();

        var boundingBox;
        var center;

        // URDF-Loader code
        import { LoadingManager } from '../three/build/three.module.js';
        import URDFLoader from '../urdf-loader/src/URDFLoader.js';

        const manager = new LoadingManager();
        const loader = new URDFLoader(manager);
        loader.packages = {
            //packageName : '../../static'           // The equivalent of a (list of) ROS package(s):// directory (unnecessary)
        };
        loader.load(
            //'static/urdf/T12/urdf/T12_flipped.URDF',
            //'static/urdf/r2d2/r2d2.urdf',
            'static/urdf/ar2_sim/ar2.urdf',                    // The path to the URDF within the package OR absolute
            robot => { 
                // The robot is loaded!  
                robot.position.set(0, 0, 0)
                robot.scale.set(70,70,70);          //robot was too small initially
                robot.rotateX(-1.571);          //robot had a 90 degrees rotation initially

                //robot.castShadow = true;
                //robot.receiveShadow = true;

                scene.add( robot );

                

                
            }
            
        );
        
        
        //code for the block
        let pos = {x: 0, y: 0, z: 0};
        let scale = {x: 50, y: 2, z: 50}; //sets block dimensions
        
        let blockPlane = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0xa0afa4}));

        blockPlane.position.set(pos.x, pos.y, pos.z);
        blockPlane.scale.set(scale.x, scale.y, scale.z);

        blockPlane.castShadow = true;
        blockPlane.receiveShadow = true;

        scene.add(blockPlane);
        

        function animate() {

            requestAnimationFrame( animate );
            
            // required if controls.enableDamping or controls.autoRotate are set to true
            controls.update();
            renderer.render( scene, camera );
        };

        animate();	