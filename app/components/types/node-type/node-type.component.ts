// File: node-type.component.ts
// Created by: Daniel James
// Date created: February 22, 2017
//

import { Component, Input } from "@angular/core";
import { BaseTypeComponent } from "../type-injector/base-classes";
import { Value, Type } from "sinap-types";
import { ElementValue } from "sinap-core";

@Component({
    selector: "sinap-node-type",
    templateUrl: "./node-type.component.html",
    styleUrls: ["./node-type.component.scss"]
})
export class NodeTypeComponent extends BaseTypeComponent<ElementValue> {
    private label: string = "";
    private _borderColor?: string;
    private _color?: string;

    private options: [string, Value.Value][] = [];

    get borderColor() {
        return this._borderColor ? this._borderColor : "#000000";
    }

    get color() {
        return this._color ? this._color : "#fff2000";
    }

    @Input()
    set value(value: ElementValue) {
        super.value = value;

        if (!this.readonly) {
            console.log(value, "here");

            this.options = [...value.environment.values.entries()].map((v) => v[1]).filter((v) => {
                return Type.isSubtype(v.type, value.type)
            }).map((n): [string, Value.Value] => [this.getPrimitiveAsString(n as Value.CustomObject, "label")!, n]);
        } else this.options = [];

        this.selectedOption(value);
    }

    // TODO: Move this into a util collection
    private getPrimitiveAsString(v: Value.CustomObject, key: string): string | undefined {
        if (v.type.members.has(key)) {
            const keyValue = v.get(key);
            if (keyValue instanceof Value.Primitive && typeof keyValue.value === "string") {
                return keyValue.value;
            }
        }

        return undefined;
    }

    selectedOption(option: ElementValue) {
        super.value = option;

        this._borderColor = this.getPrimitiveAsString(option, "borderColor");
        this._color = this.getPrimitiveAsString(option, "color");

        const label = this.getPrimitiveAsString(option, "label");

        const index = [...option.environment.values.entries()].map((v) => v[1]).filter((v) => {
            return Type.isSubtype(v.type, option.type);
        }).indexOf(option);

        this.label = label ? label : option.type.pluginType.name + " " + index;
    }
}
