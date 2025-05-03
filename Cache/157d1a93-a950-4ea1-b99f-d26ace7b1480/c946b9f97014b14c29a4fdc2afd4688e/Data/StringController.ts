import { Interactable } from "../SpectaclesSyncKit/SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable";
import { SyncTransform } from "../SpectaclesSyncKit/Components/SyncTransform";

/**
 * Controls the string that players grab to move the boat
 */
@component
export class StringController extends BaseScriptComponent {
    // References to the string ends that players can grab
    @input
    leftStringEnd!: SceneObject;
    
    @input
    rightStringEnd!: SceneObject;
    
    // Reference to the boat object
    @input
    boat!: SceneObject;
    
    // Visual representation of the string
    @input
    stringVisual!: SceneObject;
    
    // Win condition distance
    @input
    winDistance: number = 10;
    
    // Interactable components for the string ends
    private leftInteractable!: Interactable;
    private rightInteractable!: Interactable;
    
    // Track if the string ends are being held
    private isLeftEndHeld: boolean = false;
    private isRightEndHeld: boolean = false;
    
    // Original positions of the string ends
    private leftOriginalPosition: vec3 = vec3.zero();
    private rightOriginalPosition: vec3 = vec3.zero();
    
    // Starting position of the boat
    private startPosition: vec3 = vec3.zero();
    
    // Game state
    private gameCompleted: boolean = false;
    
    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        });
    }
    
    onStart(): void {
        // Get the Interactable components from the string ends
        this.leftInteractable = this.leftStringEnd.getComponent("Interactable") as Interactable;
        this.rightInteractable = this.rightStringEnd.getComponent("Interactable") as Interactable;
        
        if (!this.leftInteractable || !this.rightInteractable) {
            console.error("StringController: Interactable components not found on string ends");
            return;
        }
        
        // Store original positions
        this.leftOriginalPosition = this.leftStringEnd.getTransform().getLocalPosition();
        this.rightOriginalPosition = this.rightStringEnd.getTransform().getLocalPosition();
        
        // Store boat starting position
        this.startPosition = this.boat.getTransform().getWorldPosition();
        
        // Set up interaction callbacks
        this.setupInteractionCallbacks();
    }
    
    setupInteractionCallbacks(): void {
        // Left string end interaction
        this.leftInteractable.onTriggerStart.add((event) => {
            this.isLeftEndHeld = true;
            this.updateBoatPosition();
        });
        
        this.leftInteractable.onTriggerEnd.add((event) => {
            this.isLeftEndHeld = false;
            // Reset position when released
            this.leftStringEnd.getTransform().setLocalPosition(this.leftOriginalPosition);
        });
        
        // Right string end interaction
        this.rightInteractable.onTriggerStart.add((event) => {
            this.isRightEndHeld = true;
            this.updateBoatPosition();
        });
        
        this.rightInteractable.onTriggerEnd.add((event) => {
            this.isRightEndHeld = false;
            // Reset position when released
            this.rightStringEnd.getTransform().setLocalPosition(this.rightOriginalPosition);
        });
        
        // Drag updates for both ends
        this.leftInteractable.onDragUpdate.add((event) => {
            if (this.isLeftEndHeld) {
                this.updateStringVisual();
                this.updateBoatPosition();
            }
        });
        
        this.rightInteractable.onDragUpdate.add((event) => {
            if (this.isRightEndHeld) {
                this.updateStringVisual();
                this.updateBoatPosition();
            }
        });
    }
    
    updateStringVisual(): void {
        // Update the visual representation of the string between the two ends
        if (this.stringVisual) {
            const leftPos = this.leftStringEnd.getTransform().getWorldPosition();
            const rightPos = this.rightStringEnd.getTransform().getWorldPosition();
            
            // Calculate the midpoint between the two ends
            const midpoint = vec3.lerp(leftPos, rightPos, 0.5);
            this.stringVisual.getTransform().setWorldPosition(midpoint);
            
            // Calculate the direction and scale to fit between the two ends
            const direction = vec3.normalize(vec3.sub(rightPos, leftPos));
            const distance = vec3.distance(leftPos, rightPos);
            
            // Set the scale of the string visual to match the distance
            this.stringVisual.getTransform().setWorldScale(new vec3(distance, 1, 1));
            
            // Set the rotation to align with the direction between the two ends
            const lookRotation = quat.lookRotation(direction, new vec3(0, 1, 0));
            this.stringVisual.getTransform().setWorldRotation(lookRotation);
        }
    }
    
    updateBoatPosition(): void {
        // Only move the boat if both ends of the string are being held
        if (this.isLeftEndHeld && this.isRightEndHeld && !this.gameCompleted) {
            // Calculate the midpoint between the two string ends
            const leftPos = this.leftStringEnd.getTransform().getWorldPosition();
            const rightPos = this.rightStringEnd.getTransform().getWorldPosition();
            const midpoint = vec3.lerp(leftPos, rightPos, 0.5);
            
            // Move the boat to the midpoint position
            this.boat.getTransform().setWorldPosition(midpoint);
            
            // Check if we've moved forward 10 units
            this.checkWinCondition();
        }
    }
    
    checkWinCondition(): void {
        const currentPosition = this.boat.getTransform().getWorldPosition();
        const forwardDirection = new vec3(0, 0, 1); // Assuming forward is along the z-axis
        
        // Calculate the projection of the displacement onto the forward direction
        const displacement = vec3.sub(currentPosition, this.startPosition);
        const forwardDistance = vec3.dot(displacement, forwardDirection);
        
        // Check if we've moved forward by the win distance
        if (forwardDistance >= this.winDistance && !this.gameCompleted) {
            this.gameCompleted = true;
            console.log("Complete");
            // You could add more celebration effects here
        }
    }
    
    onUpdate(): void {
        // Update the string visual every frame if either end is held
        if (this.isLeftEndHeld || this.isRightEndHeld) {
            this.updateStringVisual();
        }
    }
}
