// File: side-bar.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016


import { Component, Input } from "@angular/core";


@Component({
  moduleId: module.id,
  selector: "sinap-side-bar",
  templateUrl: "../html/side-bar.component.html",
  styleUrls: [ "../styles/side-bar.component.css" ]
})
export class SideBarComponent {
  @Input() icons: SideBarIcon[];
  private _active: String;

  get active() {
    if (this._active) {
      return this._active;
    } else {
      return this.icons[0].name;
    }
  }

  set active(v: String) {
    this._active = v;
  }

  setActive(icon:SideBarIcon) {
    this._active = icon.name;
  }
}

export interface SideBarIcon {
  path: String;
  name: String;
}