import { SyncTransform } from "../SpectaclesSyncKit/Components/SyncTransform";

/**
 * Controls the boat movement along a predefined path
 */
@component
export class BoatController extends BaseScriptComponent {
    // Reference to the path object
    @input
    pathObject!: SceneObject;
    
    // Reference to the string controller
    @input
    stringController!: SceneObject;
    
    // Path movement settings
    @input
    pathSpeed: number = 0.5;
    
    @input
    smoothing: number = 0.1;
    
    // Path points (will be populated from the path object)
    private pathPoints: vec3[] = [];
    
    // Current position along the path (0-1)
    private pathPosition: number = 0;
    
    // Target position along the path
    private targetPathPosition: number = 0;
    
    // Is the boat currently moving
    private isMoving: boolean = false;
    
    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        });
    }
    
    onStart(): void {
        // Initialize the path points
        this.initializePath();
        
        // Make sure the boat has a SyncTransform component for multiplayer
        const syncTransform = this.getSceneObject().getComponent(SyncTransform.getTypeName()) as SyncTransform;
        if (!syncTransform) {
            print("[WARNING] BoatController: No SyncTransform component found. Adding one...");
            // You would add a SyncTransform component here if needed
        }
    }
    
    initializePath(): void {
        // In a real implementation, you would extract path points from your path object
        // This is a simplified version with a circular path
        if (!this.pathObject) {
            print("[ERROR] BoatController: No path object assigned");
            return;
        }
        
        // For this example, we'll create a simple circular path
        // In a real implementation, you would extract this from your path object
        const radius = 5;
        const numPoints = 20;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            this.pathPoints.push(new vec3(x, 0, z));
        }
        
        // Position the boat at the start of the path
        if (this.pathPoints.length > 0) {
            this.getTransform().setLocalPosition(this.pathPoints[0]);
            
            // Set the initial rotation to face the direction of the path
            if (this.pathPoints.length > 1) {
                const direction = this.pathPoints[1].sub(this.pathPoints[0]).normalize();
                const lookRotation = quat.lookAt(direction, new vec3(0, 1, 0));
                this.getTransform().setLocalRotation(lookRotation);
            }
        }
    }
    
    // Called by StringController when both string ends are held and moved
    setTargetPathPosition(position: number): void {
        this.targetPathPosition = Math.max(0, Math.min(1, position));
        this.isMoving = true;
    }
    
    // Get position on the path based on t value (0-1)
    getPositionOnPath(t: number): vec3 {
        if (this.pathPoints.length === 0) {
            return vec3.zero();
        }
        
        // Ensure t is between 0 and 1
        t = Math.max(0, Math.min(1, t));
        
        // Convert t to an index in the path points array
        const index = t * (this.pathPoints.length - 1);
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);
        const blend = index - lowerIndex;
        
        // Handle edge cases
        if (lowerIndex === upperIndex || upperIndex >= this.pathPoints.length) {
            return this.pathPoints[lowerIndex];
        }
        
        // Interpolate between the two closest points
        return vec3.lerp(
            this.pathPoints[lowerIndex],
            this.pathPoints[upperIndex],
            blend
        );
    }
    
    // Get direction on the path based on t value (0-1)
    getDirectionOnPath(t: number): vec3 {
        if (this.pathPoints.length < 2) {
            return new vec3(0, 0, 1);
        }
        
        // Ensure t is between 0 and 1
        t = Math.max(0, Math.min(1, t));
        
        // Get positions slightly before and after t
        const delta = 0.01;
        const pos1 = this.getPositionOnPath(Math.max(0, t - delta));
        const pos2 = this.getPositionOnPath(Math.min(1, t + delta));
        
        // Calculate direction
        const direction = pos2.sub(pos1);
        return direction.normalize();
    }
    
    onUpdate(): void {
        if (!this.isMoving) {
            return;
        }
        
        // Smoothly interpolate current position towards target position
        this.pathPosition = MathUtils.lerp(
            this.pathPosition,
            this.targetPathPosition,
            this.smoothing
        );
        
        // Get the position and direction on the path
        const position = this.getPositionOnPath(this.pathPosition);
        const direction = this.getDirectionOnPath(this.pathPosition);
        
        // Update the boat's position and rotation
        this.getTransform().setLocalPosition(position);
        
        // Set rotation to face the direction of travel
        if (direction.length > 0.001) {
            const lookRotation = quat.lookAt(direction, new vec3(0, 1, 0));
            this.getTransform().setLocalRotation(lookRotation);
        }
    }
}
