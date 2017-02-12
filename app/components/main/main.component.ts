// File: main.component.ts
// Created by: CJ Dimaano
// Date created: October 10, 2016
//
// This is the main application component. It is used as the main UI display for
// presenting content to the user.
//


import { Component, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from "@angular/core";
import { MenuService, MenuEventListener, MenuEvent } from "../../services/menu.service";
import { MenuEventAction } from "../../models/menu";
import { GraphEditorComponent, Drawable as DrawableInterface } from "../graph-editor/graph-editor.component";
import { PluginService } from "../../services/plugin.service";
import { Program } from "../../models/plugin";
import { WindowService } from "../../modal-windows/services/window.service"
import { ModalInfo, ModalType } from './../../models/modal-window'
import { REPLComponent, REPLDelegate } from "../repl/repl.component"
import { PropertiesPanelComponent, PropertiedEntity, PropertiedEntityLists } from "../properties-panel/properties-panel.component"
import { ToolsPanelComponent } from "../tools-panel/tools-panel.component"
import { TestPanelComponent } from "../test-panel/test-panel.component"
import { StatusBarComponent } from "../status-bar/status-bar.component"
import * as Drawable from "../../models/drawable"
import * as Core from "../../models/core"
import { SideBarComponent } from "../side-bar/side-bar.component"
import { TabBarComponent, TabDelegate } from "../tab-bar/tab-bar.component"
import { FileService, LocalFileService, File } from "../../services/files.service";
import { SerializerService } from "../../services/serializer.service";
import { SandboxService } from "../../services/sandbox.service";
import * as MagicConstants from "../../models/constants-not-to-be-included-in-beta";

@Component({
    selector: "sinap-main",
    templateUrl: "./main.component.html",
    styleUrls: ["./main.component.css"],
    providers: [MenuService, PluginService, WindowService, LocalFileService, SerializerService, SandboxService]
})

export class MainComponent implements OnInit, MenuEventListener, REPLDelegate, TabDelegate {
    constructor(private menu: MenuService, private pluginService: PluginService, private windowService: WindowService, private fileService: LocalFileService, private serializerService: SerializerService, private changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnInit(): void {
        this.repl.delegate = this;
        this.tabBar.delegate = this;
        this.menu.addEventListener(this);
    }

    ngAfterViewInit() {
        this.changeDetectorRef.detectChanges(); //http://stackoverflow.com/a/35243106 sowwwwwy...
    }

    @ViewChild(GraphEditorComponent)
    private graphEditor: GraphEditorComponent;

    @ViewChild(REPLComponent)
    private repl: REPLComponent;

    @ViewChild(PropertiesPanelComponent)
    private propertiesPanel: PropertiesPanelComponent;

    @ViewChild(ToolsPanelComponent)
    private toolsPanel: ToolsPanelComponent;

    @ViewChild("leftSideBar")
    private leftSideBar: SideBarComponent;

    @ViewChild("bottomSideBar")
    private bottomSideBar: SideBarComponent;

    @ViewChild(TestPanelComponent)
    private testComponent: TestPanelComponent;

    @ViewChild(TabBarComponent)
    private tabBar: TabBarComponent;

    public package = "Finite Automata";
    public barMessages = ["DFA", ""]

    private tabs: Map<Number, TabContext> = new Map<Number, TabContext>();
    private context: TabContext | null;

    @ViewChild(StatusBarComponent)
    private statusBar: StatusBarComponent;


    private getInterpreter(): Promise<Program> {
        const context = this.context;
        if (context) {
            const graph = this.serializerService.serialize(context.graph.core);
            return this.pluginService.getInterpreter(graph);
        } else {
            return Promise.reject("No graph context available");
        }
    }

    private onContextChanged() {
        this.barMessages = []

        if (this.context) {
            this.context.graph.activeEdgeType = "DFAEdge";
            this.context.graph.activeNodeType = "DFANode";
            if (this.graphEditor) {
                this.graphEditor.redraw();
            }
            if (this.pluginService) {
                if (this.context.graph.core.plugin.kind == MagicConstants.MACHINE_LEARNING_PLUGIN_KIND) {
                    this.package = "Machine Learning"
                } else {
                    this.package = "Finite Automata";
                    this.onChanges();
                }
            }
        }
    };

    private onChanges() {
        if (this.context && this.context.graph.core.plugin.kind == MagicConstants.DFA_PLUGIN_KIND) {
            let interp = this.getInterpreter();
            interp.then((program) => {
                this.barMessages = program.compilationMessages;
                this.testComponent.program = program;
            }).catch((err) => {
                this.barMessages = ["Compilation Error:", err];
            });
        }
    }

    newFile(f?: String, g?: Core.Graph) {
        const kind = this.toolsPanel.activeGraphType == "Machine Learning" ?
            MagicConstants.MACHINE_LEARNING_PLUGIN_KIND : MagicConstants.DFA_PLUGIN_KIND;

        this.pluginService.getPlugin(kind).then((plugin) => {
            g = g ? g : new Core.Graph(plugin);
            let filename = f ? f : "Untitled";
            let tabNumber = this.tabBar.newTab(filename);

            this.tabs.set(tabNumber, new TabContext(new Drawable.ConcreteGraph(g), filename));
            this.selectedTab(tabNumber);
        });
    }

    ngAfterViewChecked() {
        this.graphEditor.resize();
    }

    promptNewFile() {
        let [_, result] = this.windowService.createModal("sinap-new-file", ModalType.MODAL);

        result.then((result: string) => {
            this.newFile(result);
        });
    }


    /* ---------- TabBarDelegate ---------- */

    deletedTab(i: Number) {
        this.tabs.delete(i);
    }

    selectedTab(i: Number) {
        let context = this.tabs.get(i);
        if (context) {
            this.context = context;
            // TODO: add back
            // this.toolsPanel.manager = this.context.graph.pluginManager;

            // TODO: GraphEditor needs a way to set selected elements
            this.onContextChanged();
        } else {
            // No tabs
            this.context = null;
            this.onContextChanged();
        }
    }

    createNewTab() {
        this.promptNewFile();
    }

    /* ------------------------------------ */


    menuEvent(e: MenuEvent) {
        switch (e.action) {
            case MenuEventAction.NEW_FILE:
                this.promptNewFile();
                break;
            case MenuEventAction.LOAD_FILE:
                this.loadFile();
                break;
            case MenuEventAction.SAVE_FILE:
                this.saveFile();
                break;
            case MenuEventAction.CUT:
                if (this.focusIsChildOf("editor-panel")) {
                    this.graphEditor.cut();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.COPY:
                if (this.focusIsChildOf("editor-panel")) {
                    this.graphEditor.copy();
                    e.preventDefault();
                }
                break;
            case MenuEventAction.PASTE:
                if (this.focusIsChildOf("editor-panel")) {
                    this.graphEditor.paste();
                    e.preventDefault();
                }
                break;
        }
    }

    /**
     * Return true if the focused element is a child of an element with an `id` of `childOf`
     */
    private focusIsChildOf(childOf: string) {
        function elementIsChildOf(element: Element, id: string): boolean {
            while (element.parentElement) {
                if (element.parentElement.id == id) {
                    return true;
                } else {
                    return elementIsChildOf(element.parentElement, id);
                }
            }

            return false;
        }

        return document.hasFocus() && elementIsChildOf(document.activeElement, childOf);
    }

    saveFile() {
        this.fileService.requestSaveFile()
            .then((file: File) => {
                if (!this.context) {
                    alert("No open graph to save");
                    return;
                }

                const pojo = this.serializerService.serialize(this.context.graph.core);

                file.writeData(JSON.stringify(pojo, null, 4))
                    .catch((err) => {
                        alert(`Error occurred while saving to file ${file.name}: ${err}.`);
                    });
            });
    }

    loadFile() {
        this.fileService.requestFiles()
            .then((files: File[]) => {
                for (const file of files) {
                    file.readData().then((data) => {
                        const pojo = JSON.parse(data);
                        return this.serializerService.deserialize(pojo)
                            .then((graph) => this.newFile(file.name, graph));
                    })
                        .catch((err: any) => alert(`Error reading file ${file.name}: ${err}`));
                }
            });
    }

    run(input: string): Promise<string> {
        let interpreter = this.getInterpreter()
            .catch((err) => {
                this.barMessages = ['Compilation error', err];
                return Promise.reject(err);
            });
        return interpreter.then((program) => {
            this.barMessages = program.compilationMessages;
            return program.run(input).then((obj: any): string => obj.toString());
        });
    }

    propertyChanged(event: [PropertiedEntity, keyof PropertiedEntityLists, string, string[]]) {
        this.onChanges();

        // THIS IS SUPER DIRTY AND CJ SHOULD REALLY HOOK THE CHANGE DETECTOR
        // TODO: KILL THIS WITH FIRE
        let [entity, group, key, keyPath] = event;
        if (group == "drawableProperties") {
            const lst = entity.drawableProperties as Core.MappedPropertyList;
            const drawableKey = lst.key(key);
            this.graphEditor.update(entity as any, drawableKey);
        }
    }

    graphSelectionChanged(selected: Set<PropertiedEntity>) {
        let newSelectedEntity: PropertiedEntity | null = null;
        if (selected.size > 0) {
            for (let x of selected) {
                // this cast is safe because we know that the only Drawables that we
                // ever give the `graphEditor` are `Element`s
                newSelectedEntity = x;
                break;
            }
        } else {
            if (this.context) {
                newSelectedEntity = this.context.graph.core;
            } else {
                throw "How did graph selection change, there's no context? ";

            }
        }
        // ugly trick to silence the fact that things seem to get emitted too often
        // TODO, reduce the frequency things are emitted
        if (this.propertiesPanel.selectedEntity != newSelectedEntity) {
            this.propertiesPanel.selectedEntity = newSelectedEntity;
        }
    }
}

class TabContext {
    selectedDrawables = new Set<DrawableInterface>();
    constructor(public graph: Drawable.ConcreteGraph, public filename?: String) { };
}
