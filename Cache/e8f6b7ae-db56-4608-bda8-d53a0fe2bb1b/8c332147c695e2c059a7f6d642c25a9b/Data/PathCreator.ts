/**
 * Creates and visualizes a path for the boat to follow
 */
@component
export class PathCreator extends BaseScriptComponent {
    // Path settings
    @input
    pathRadius: number = 5;
    
    @input
    pathHeight: number = 0;
    
    @input
    numPoints: number = 20;
    
    @input
    pathShape: string = "circle"; // "circle", "square", "custom"
    
    // Visual representation
    @input
    showPathVisual: boolean = true;
    
    @input
    pathVisualPrefab!: SceneObject;
    
    // Path points
    private pathPoints: vec3[] = [];
    private pathVisuals: SceneObject[] = [];
    
    onAwake(): void {
        this.createEvent("OnStartEvent").bind(() => {
            this.onStart();
        });
    }
    
    onStart(): void {
        this.generatePath();
        
        if (this.showPathVisual) {
            this.createPathVisuals();
        }
    }
    
    generatePath(): void {
        this.pathPoints = [];
        
        switch (this.pathShape) {
            case "circle":
                this.generateCirclePath();
                break;
            case "square":
                this.generateSquarePath();
                break;
            case "custom":
                // In a real implementation, you would load custom path points here
                this.generateCirclePath(); // Fallback to circle
                break;
            default:
                this.generateCirclePath();
                break;
        }
    }
    
    generateCirclePath(): void {
        for (let i = 0; i < this.numPoints; i++) {
            const angle = (i / this.numPoints) * Math.PI * 2;
            const x = Math.cos(angle) * this.pathRadius;
            const z = Math.sin(angle) * this.pathRadius;
            this.pathPoints.push(new vec3(x, this.pathHeight, z));
        }
        
        // Close the loop
        this.pathPoints.push(this.pathPoints[0].clone());
    }
    
    generateSquarePath(): void {
        // Create a square path
        const halfSize = this.pathRadius;
        
        // Bottom edge (moving right)
        for (let i = 0; i < this.numPoints / 4; i++) {
            const t = i / (this.numPoints / 4);
            const x = MathUtils.lerp(-halfSize, halfSize, t);
            const z = -halfSize;
            this.pathPoints.push(new vec3(x, this.pathHeight, z));
        }
        
        // Right edge (moving up)
        for (let i = 0; i < this.numPoints / 4; i++) {
            const t = i / (this.numPoints / 4);
            const x = halfSize;
            const z = MathUtils.lerp(-halfSize, halfSize, t);
            this.pathPoints.push(new vec3(x, this.pathHeight, z));
        }
        
        // Top edge (moving left)
        for (let i = 0; i < this.numPoints / 4; i++) {
            const t = i / (this.numPoints / 4);
            const x = MathUtils.lerp(halfSize, -halfSize, t);
            const z = halfSize;
            this.pathPoints.push(new vec3(x, this.pathHeight, z));
        }
        
        // Left edge (moving down)
        for (let i = 0; i < this.numPoints / 4; i++) {
            const t = i / (this.numPoints / 4);
            const x = -halfSize;
            const z = MathUtils.lerp(halfSize, -halfSize, t);
            this.pathPoints.push(new vec3(x, this.pathHeight, z));
        }
        
        // Close the loop
        this.pathPoints.push(this.pathPoints[0].clone());
    }
    
    createPathVisuals(): void {
        if (!this.pathVisualPrefab) {
            console.error("PathCreator: No path visual prefab assigned");
            return;
        }
        
        // Clean up existing visuals
        for (const visual of this.pathVisuals) {
            if (visual) {
                visual.destroy();
            }
        }
        this.pathVisuals = [];
        
        // Create new visuals
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const start = this.pathPoints[i];
            const end = this.pathPoints[i + 1];
            
            // Create a visual segment
            const visual = this.createPathSegment(start, end);
            if (visual) {
                this.pathVisuals.push(visual);
            }
        }
    }
    
    createPathSegment(start: vec3, end: vec3): SceneObject | null {
        if (!this.pathVisualPrefab) {
            return null;
        }
        
        // Create a new instance of the path visual
        const segment = this.pathVisualPrefab.instantiate();
        if (!segment) {
            return null;
        }
        
        // Position at the midpoint
        const midpoint = vec3.lerp(start, end, 0.5);
        segment.getTransform().setWorldPosition(midpoint);
        
        // Scale to match the length
        const distance = vec3.distance(start, end);
        segment.getTransform().setWorldScale(new vec3(0.1, 0.1, distance));
        
        // Rotate to align with the direction
        const direction = vec3.normalize(vec3.sub(end, start));
        const lookRotation = quat.lookRotation(direction, new vec3(0, 1, 0));
        segment.getTransform().setWorldRotation(lookRotation);
        
        return segment;
    }
    
    // Get the closest point on the path to a given position
    getClosestPointOnPath(position: vec3): { point: vec3, progress: number } {
        if (this.pathPoints.length === 0) {
            return { point: vec3.zero(), progress: 0 };
        }
        
        let closestPoint = this.pathPoints[0];
        let closestDistance = vec3.distance(position, closestPoint);
        let closestSegmentIndex = 0;
        let closestSegmentT = 0;
        
        // Check each path segment
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const start = this.pathPoints[i];
            const end = this.pathPoints[i + 1];
            
            // Get closest point on this segment
            const { point, t } = this.getClosestPointOnSegment(position, start, end);
            const distance = vec3.distance(position, point);
            
            // Update if this is closer
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = point;
                closestSegmentIndex = i;
                closestSegmentT = t;
            }
        }
        
        // Calculate progress along the entire path (0-1)
        const segmentCount = this.pathPoints.length - 1;
        const progress = (closestSegmentIndex + closestSegmentT) / segmentCount;
        
        return { point: closestPoint, progress };
    }
    
    // Get the closest point on a line segment
    getClosestPointOnSegment(point: vec3, start: vec3, end: vec3): { point: vec3, t: number } {
        const segment = vec3.sub(end, start);
        const segmentLength = vec3.length(segment);
        
        if (segmentLength < 0.0001) {
            return { point: start, t: 0 };
        }
        
        const segmentDirection = vec3.scale(segment, 1 / segmentLength);
        const pointToStart = vec3.sub(point, start);
        
        // Project point onto segment
        const projection = vec3.dot(pointToStart, segmentDirection);
        const t = MathUtils.clamp(projection / segmentLength, 0, 1);
        
        // Calculate the closest point
        const closestPoint = vec3.add(start, vec3.scale(segmentDirection, t * segmentLength));
        
        return { point: closestPoint, t };
    }
    
    // Get position on the path based on progress (0-1)
    getPositionOnPath(progress: number): vec3 {
        if (this.pathPoints.length < 2) {
            return vec3.zero();
        }
        
        // Ensure progress is between 0 and 1
        progress = Math.max(0, Math.min(1, progress));
        
        // Calculate the segment index and blend factor
        const segmentCount = this.pathPoints.length - 1;
        const exactIndex = progress * segmentCount;
        const segmentIndex = Math.floor(exactIndex);
        const segmentBlend = exactIndex - segmentIndex;
        
        // Handle edge case
        if (segmentIndex >= segmentCount) {
            return this.pathPoints[segmentCount];
        }
        
        // Interpolate between segment start and end
        const start = this.pathPoints[segmentIndex];
        const end = this.pathPoints[segmentIndex + 1];
        
        return vec3.lerp(start, end, segmentBlend);
    }
    
    // Get all path points
    getPathPoints(): vec3[] {
        return this.pathPoints;
    }
}
