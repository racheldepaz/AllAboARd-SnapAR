/**
 * A simplified game manager for the co-located boat game
 * This handles player detection and enables the game elements when both players are present
 */
@component
export class SimpleGameManager extends BaseScriptComponent {
    // Reference to the player indicators (visual representation of each player)
    @input
    playerOneIndicator!: SceneObject;
    
    @input
    playerTwoIndicator!: SceneObject;
    
    // Reference to the boat and string controller
    @input
    boat!: SceneObject;
    
    @input
    stringController!: SceneObject;
    
    // Game state
    private isGameReady: boolean = false;
    private playerCount: number = 0;
    
    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        });
    }
    
    onStart(): void {
        // Initialize player indicators as disabled
        if (this.playerOneIndicator) {
            this.playerOneIndicator.enabled = false;
        }
        
        if (this.playerTwoIndicator) {
            this.playerTwoIndicator.enabled = false;
        }
        
        // Disable game elements until both players are present
        if (this.stringController) {
            this.stringController.enabled = false;
        }
        
        if (this.boat) {
            this.boat.enabled = false;
        }
        
        // Set up event to detect when a new player joins
        // In a real implementation, this would use SpectaclesSyncKit
        // For this simplified version, we'll simulate player joining
        this.simulatePlayerJoining();
    }
    
    simulatePlayerJoining(): void {
        // Simulate first player joining after 2 seconds
        const firstPlayerEvent = this.createEvent("DelayedCallbackEvent");
        firstPlayerEvent.bind(() => {
            this.playerJoined();
        });
        firstPlayerEvent.reset(2);
        
        // Simulate second player joining after 4 seconds
        const secondPlayerEvent = this.createEvent("DelayedCallbackEvent");
        secondPlayerEvent.bind(() => {
            this.playerJoined();
        });
        secondPlayerEvent.reset(4);
    }
    
    playerJoined(): void {
        // Increment player count
        this.playerCount++;
        print("Player joined! Player count: " + this.playerCount);
        
        // Update player indicators
        this.updatePlayerIndicators();
        
        // Check if we have enough players to start
        if (this.playerCount >= 2 && !this.isGameReady) {
            this.isGameReady = true;
            this.startGame();
        }
    }
    
    updatePlayerIndicators(): void {
        // Update player indicators based on player count
        if (this.playerCount >= 1 && this.playerOneIndicator) {
            this.playerOneIndicator.enabled = true;
        }
        
        if (this.playerCount >= 2 && this.playerTwoIndicator) {
            this.playerTwoIndicator.enabled = true;
        }
    }
    
    startGame(): void {
        print("Both players are present! Starting the game...");
        
        // Enable game elements
        if (this.stringController) {
            this.stringController.enabled = true;
        }
        
        if (this.boat) {
            this.boat.enabled = true;
        }
    }
}
