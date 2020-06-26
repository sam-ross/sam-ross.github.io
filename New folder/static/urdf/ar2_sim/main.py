import pybullet as p
import time
import pybullet_data
physicsClient = p.connect(p.GUI, options="--opengl2")#or p.DIRECT for non-graphical version
p.setAdditionalSearchPath(pybullet_data.getDataPath()) #optionally

p.setGravity(0,0,-10)
planeId = p.loadURDF("plane.urdf")

#p.loadURDF("r2d2.urdf", [1, 1, 1])

cubeStartPos = [0,0,1]
cubeStartOrientation = p.getQuaternionFromEuler([0,0,0])
arm_id = p.loadURDF("ar2.urdf",cubeStartPos, cubeStartOrientation)
num_joints = p.getNumJoints(arm_id)
print(f"arm id = {arm_id}")
print(f"joints = {num_joints}")

#motors = p.setJointMotorControlArray(arm_id, [i for i in range(num_joints)], p.POSITION_CONTROL)

for i in range (10000):
    p.stepSimulation()
    time.sleep(1./240.)

cubePos, cubeOrn = p.getBasePositionAndOrientation(num_joints)
p.disconnect()
