// File: dynamic-component.component.ts
// Created by: Daniel James
// Date created: January 30, 2017
//


import { Component, ViewContainerRef, ViewChild, ComponentFactoryResolver, ComponentRef, OnInit, Type, ReflectiveInjector } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { WindowService, WindowDelegate } from './../../services/window.service';
import { ModalComponent, ModalInfo } from "./../../../models/modal-window";

import { NewFileComponent } from './../../../components/new-file/new-file.component'; // TODO, shorter way to do this...?
import { PluginManager } from "../../../components/plugin-manager/plugin-manager.component";

/**
 * This component loads one of the components specified in componentMap depending on ModalInfo.kind for this window.
 */
@Component({
    selector: 'sinap-dynamic-component',
    entryComponents: [NewFileComponent, PluginManager],
    template: `<div #container></div>`,
    providers: [WindowService]
})
export class DynamicComponent implements WindowDelegate, OnInit {
    private currentComponent: ComponentRef<any>;

    @ViewChild('container', { read: ViewContainerRef })
    private container: ViewContainerRef;

    /**
     * Add the type information for each component you want this component to be able to create.
     */
    private componentMap = new Map<string, [string, Type<ModalComponent>]>(
        [
            ["sinap-new-file", ["New File", NewFileComponent]],
            ["plugin-manager", ["Plugin Manager", PluginManager]]
        ]
        // Preferences, etc...
    );

    constructor(private resolver: ComponentFactoryResolver, private titleService: Title, private windowService: WindowService) { }

    ngOnInit() {
        this.windowService.windowDelegate = this;
    }

    newWindow = (windowInfo: ModalInfo) => {
        this.container.clear();
        const componentInfo = this.componentMap.get(windowInfo.selector);

        if (componentInfo) {
            const injector = ReflectiveInjector.fromResolvedProviders([], this.container.parentInjector);

            const [name, componentType] = componentInfo;

            this.titleService.setTitle(name);

            const factory = this.resolver.resolveComponentFactory(componentType);
            const component = factory.create(injector);
            component.instance.modalInfo = windowInfo;
            this.container.insert(component.hostView);

            component.changeDetectorRef.detectChanges();
        };
    }
}
