// // File: list-type.component.ts
// // Created by: Daniel James
// // Date created: March 6, 2017
// //

// import { Component, Input } from "@angular/core";
// import { CoreValue } from "sinap-core";

// @Component({
//     selector: "sinap-list-type",
//     templateUrl: "./list-type.component.html",
//     styleUrls: ["./list-type.component.scss"]
// })
// export class ListTypeComponent {
//     @Input() _value: CoreValue;
//     @Input() readonly: boolean = true;

//     private values: CoreValue[] = [];

//     @Input()
//     set value(v: CoreValue) {
//         if (this.values.length === 0 && Array.isArray(v.value)) {
//             const type = (v.type.env as any).lookupPluginType("Nodes");
//             this.values = v.value.map((v) => new CoreValue(type, v));
//         }
//     }
// }
