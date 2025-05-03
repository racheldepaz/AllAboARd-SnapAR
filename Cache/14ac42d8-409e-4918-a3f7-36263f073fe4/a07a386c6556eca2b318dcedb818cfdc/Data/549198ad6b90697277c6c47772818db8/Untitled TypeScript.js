"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewScript = void 0;
var __selfType = requireType("./checkboth");
function component(target) { target.getTypeName = function () { return __selfType; }; }
let NewScript = class NewScript extends BaseScriptComponent {
    onAwake() {
        this.sphereManipulation1.onManipulationStart.add(() => {
            this.isSphere1IsManipulated = true;
        });
        this.sphereManipulation2.onManipulationStart.add(() => {
            this.isSphere2IsManipulated = true;
        });
        this.createEvent("UpdateEvent").bind(() => {
            this.checkBothSphere();
        });
    }
    checkBothSphere() {
        if (this.isSphere1IsManipulated && this.isSphere2IsManipulated) {
            print("Both spheres are manipulated");
        }
    }
    __initialize() {
        super.__initialize();
        this.isSphere1IsManipulated = false;
        this.isSphere2IsManipulated = false;
    }
};
exports.NewScript = NewScript;
exports.NewScript = NewScript = __decorate([
    component
], NewScript);
//# sourceMappingURL=checkboth.js.map