// File: modal-window.module.ts
// Created by: Daniel James
// Date created: January 17, 2017
//
// Module for the new file window.
//


import { NgModule } from "@angular/core";
import { BrowserModule, Title } from "@angular/platform-browser";

import { ResizableModule } from 'angular-resizable-element';

import { FormsModule } from '@angular/forms';
import { NewFileComponent } from './../components/new-file/new-file.component';
import { CollapsibleListComponent } from './../components/collapsible-list/collapsible-list.component';
import { DynamicComponent } from './components/dynamic-component/dynamic-component.component';
import { PluginManager } from "../components/plugin-manager/plugin-manager.component";
import { PluginService } from "../services/plugin.service";
import { PluginListComponent } from "../components/plugins-list/plugins-list.component";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        ResizableModule
    ],
    declarations: [
        NewFileComponent,
        CollapsibleListComponent,
        DynamicComponent,
        PluginManager,
        PluginListComponent
    ],
    providers: [
        Title,
        PluginService
    ],
    bootstrap: [DynamicComponent]
})
export class ModalWindowModule { }
