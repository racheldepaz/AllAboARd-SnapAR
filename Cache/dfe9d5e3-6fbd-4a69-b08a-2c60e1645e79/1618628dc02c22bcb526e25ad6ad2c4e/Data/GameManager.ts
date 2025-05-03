import { SyncEntity } from "../SpectaclesSyncKit/Core/SyncEntity";
import { StorageProperty } from "../SpectaclesSyncKit/Core/StorageProperty";
import { StoragePropertySet } from "../SpectaclesSyncKit/Core/StoragePropertySet";
import { NetworkIdOptions } from "../SpectaclesSyncKit/Core/NetworkIdTools";
import { NetworkIdType, networkIdFromString } from "../SpectaclesSyncKit/Core/NetworkIdType";
import { PropertyType, propertyTypeFromString } from "../SpectaclesSyncKit/Core/PropertyType";
import { persistenceTypeFromString } from "../SpectaclesSyncKit/Core/PersistenceType";

/**
 * Manages the co-located multiplayer experience for the boat game
 */
@component
export class GameManager extends BaseScriptComponent {
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
    private isLocalPlayerReady: boolean = false;
    
    // Sync properties
    private playerCountProp!: StorageProperty<number>;
    private gameReadyProp!: StorageProperty<boolean>;
    private storageProps!: StoragePropertySet;
    private syncEntity!: SyncEntity;
    
    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        });
    }
    
    onStart(): void {
        // Initialize sync properties for multiplayer
        this.setupSyncProperties();
        
        // Initialize player indicators as disabled
        if (this.playerOneIndicator) {
            this.playerOneIndicator.enabled = false;
        }
        
        if (this.playerTwoIndicator) {
            this.playerTwoIndicator.enabled = false;
        }
        
        // Listen for player count changes
        this.playerCountProp.addListener(this.onPlayerCountChanged.bind(this));
        this.gameReadyProp.addListener(this.onGameReadyChanged.bind(this));
        
        // Register this player
        this.registerPlayer();
    }
    
    setupSyncProperties(): void {
        // Create sync properties for player count and game state
        this.playerCountProp = StorageProperty.forNumber(0, PropertyType.Local);
        this.gameReadyProp = StorageProperty.forBoolean(false, PropertyType.Local);
        
        // Create storage property set
        this.storageProps = new StoragePropertySet([
            this.playerCountProp,
            this.gameReadyProp
        ]);
        
        // Create sync entity with session persistence
        this.syncEntity = new SyncEntity(
            this,
            this.storageProps,
            false,
            RealtimeStoreCreateOptions.Persistence.Session,
            new NetworkIdOptions(NetworkIdType.Custom, "boat_game_manager")
        );
    }
    
    registerPlayer(): void {
        // Wait for sync to be ready
        const readyEvent = this.createEvent("update"); // Using a standard event name from EventNameMap
        readyEvent.bind(() => {
            // Increment player count
            const currentCount = this.playerCountProp.get() || 0;
            this.playerCountProp.set(currentCount + 1);
            this.isLocalPlayerReady = true;
            
            // Update player indicators
            this.updatePlayerIndicators();
        });
        
        // Trigger the ready event when sync is ready
        this.syncEntity.registerReadyCallback(() => {
            readyEvent.trigger();
        });
    }
    
    onPlayerCountChanged(newCount: number): void {
        this.playerCount = newCount;
        print("Player count changed: " + newCount);
        
        // Update player indicators
        this.updatePlayerIndicators();
        
        // Check if we have enough players to start
        if (newCount >= 2) {
            this.gameReadyProp.set(true);
        } else {
            this.gameReadyProp.set(false);
        }
    }
    
    onGameReadyChanged(isReady: boolean): void {
        this.isGameReady = isReady;
        print("Game ready state changed: " + isReady);
        
        // Enable/disable game elements based on ready state
        if (this.stringController) {
            this.stringController.enabled = isReady;
        }
        
        if (this.boat) {
            this.boat.enabled = isReady;
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
    
    onUpdate(): void {
        // You can add additional game state updates here
    }
}
