import {
    Drawable,
    PropertyChangedEvent,
} from "../components/graph-editor/graph-editor.component";
import { ElementValue, } from "sinap-core";
import { Value } from "sinap-types";
import { GraphController, UndoableEvent } from "./graph-controller";

export class Bridge {
    private isSyncing = false;

    private coreListener: (a: Value.Value, b: Value.Value, c: any) => void;
    private drawableListener: (evt: PropertyChangedEvent<any>) => void;

    constructor(private graph: GraphController, public core: ElementValue, public drawable: Drawable) {
        const computedPropertyContext = new ComputedPropertyContext(core);
        core.context = computedPropertyContext;

        // Debounce updating the computed properties.
        let timer: number | undefined;
        const updateComputedProperties = () => {
            const f = () => {
                this.sync(() => {
                    computedPropertyContext.update();
                    [...computedPropertyContext.properties.entries()].forEach(([key, [name, value]]) => {
                        this.graph.copyPropertyToDrawable(value, drawable, key);
                    });
                });
            };

            if (timer !== undefined) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    f();
                }, 100) as any;
            } else {
                timer = 0;
                f();
            }

        };

        updateComputedProperties();

        this.coreListener = (_: Value.Value, value: Value.Value, other: any) => {
            this.sync(() => {
                const key = [...core.type.members.entries()].map(([k, _]): [string, Value.Value] => [k, core.get(k)]).find(([_, v]) => {
                    if (v === value) {
                        return true;
                    } else if (v instanceof Value.Record) {
                        for (const k of Object.keys(v.value)) {
                            if (v.value[k] === value) {
                                return true;
                            }
                        }
                    } else if (v instanceof Value.Union && v.value === value) {
                        return true;
                    }

                    return false;
                });
                if (key) {
                    const [k, _] = key;

                    updateComputedProperties();

                    this.graph.copyPropertyToDrawable(core.get(k), drawable, k);

                    // TODO: Can only undo primitive and union changes.
                    if (value instanceof Value.Primitive || value instanceof Value.Union) {
                        const undo: UndoableEvent = new UndoableEvent(true, () => {
                            this.sync(() => {
                                value.value = other.from;
                                computedPropertyContext.update();
                                updateComputedProperties();
                                this.graph.copyPropertyToDrawable(core.get(k), drawable, k);
                            });
                            return new UndoableEvent(true, () => {
                                this.sync(() => {
                                    value.value = other.to;
                                    computedPropertyContext.update();
                                    updateComputedProperties();
                                    this.graph.copyPropertyToDrawable(core.get(k), drawable, k);
                                });
                                return undo.copy();
                            });
                        });

                        this.graph.changed.emit(undo);
                    }
                }
            });
        };

        this.drawableListener = (evt: PropertyChangedEvent<any>) => {
            const f = () => this.sync(() => {
                const previous = JSON.parse(JSON.stringify(evt.detail.prev));
                const current = JSON.parse(JSON.stringify(evt.detail.curr));

                const result = this.graph.copyPropertyToCore(this.drawable, this.core, evt.detail.key.toString());
                if (result) {
                    const undo: UndoableEvent = new UndoableEvent(false, () => {
                        this.sync(() => {
                            (this.drawable as any)[evt.detail.key] = previous;
                            this.graph.copyPropertyToCore(this.drawable, this.core, evt.detail.key.toString());
                        });
                        return new UndoableEvent(false, () => {
                            this.sync(() => {
                                (this.drawable as any)[evt.detail.key] = current;
                                this.graph.copyPropertyToCore(this.drawable, this.core, evt.detail.key.toString());
                            });

                            return undo.copy();
                        });
                    });

                    if (evt.detail.key !== "sourcePoint" && evt.detail.key !== "destinationPoint") {
                        this.graph.changed.emit(undo);
                    }
                }
            });

            f();
        };

        this.undeleted();
    };

    public undeleted() {
        this.core.environment.listen(this.coreListener, () => true, this.core);
        this.drawable.addEventListener("change", this.drawableListener);
    }

    public deleted() {
        this.drawable.removeEventListener("change", this.drawableListener);
    }

    public sync(f: () => void) {
        if (this.isSyncing) return;
        this.isSyncing = true;
        f();
        this.isSyncing = false;
    }
}

export class ComputedPropertyContext {
    public readonly properties = new Map<string, [string, Value.Value]>();
    public onUpdate?: (() => void) = undefined;

    constructor(public readonly value: ElementValue) { };

    update() {
        [...this.value.type.pluginType.methods.entries()].filter(([_, method]) => method.isGetter).forEach(([key, _]) => {
            let v = this.value.call(key);
            if (v) {
                this.properties.set(key, [this.value.type.prettyName(key), v]);
            }
        });

        if (this.onUpdate) {
            this.onUpdate();
        }
    }
}